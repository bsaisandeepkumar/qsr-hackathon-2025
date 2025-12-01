# recommender/vector_index.py

import os
import json
import numpy as np
from typing import List, Dict, Any

# try FAISS + SentenceTransformer, else fallback to sklearn
try:
    import faiss
    FAISS_AVAILABLE = True
except Exception:
    FAISS_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    ST_AVAILABLE = True
except Exception:
    ST_AVAILABLE = False

# Fallback tools
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

from .data_loader import load_menu

# Globals to hold index & metadata
_INDEX = None
_EMB_METHOD = None
_ITEM_IDS = []
_ITEM_META = []
_VECTOR_DIM = None
_TFIDF_VECT = None
_NN_MODEL = None
_ST_MODEL = None
_FAISS_INDEX = None

def _menu_corpus():
    menu = load_menu()
    corpus = []
    ids = []
    meta = []
    for it in menu:
        text = f"{it['name']} {' '.join(it.get('tags', []))}"
        corpus.append(text)
        ids.append(it['id'])
        meta.append(it)
    return ids, meta, corpus

def build_index(force=False):
    global _INDEX, _ITEM_IDS, _ITEM_META, _VECTOR_DIM, _TFIDF_VECT, _NN_MODEL, _ST_MODEL, _FAISS_INDEX, _EMB_METHOD

    if _INDEX is not None and not force:
        return

    ids, meta, corpus = _menu_corpus()
    _ITEM_IDS = ids
    _ITEM_META = meta

    # Prefer sentence-transformers + faiss
    if ST_AVAILABLE and FAISS_AVAILABLE:
        _EMB_METHOD = "sentence-faiss"
        # load model (small one for speed)
        _ST_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        embeddings = _ST_MODEL.encode(corpus, convert_to_numpy=True, show_progress_bar=False)
        embeddings = embeddings.astype('float32')
        _VECTOR_DIM = embeddings.shape[1]
        # build FAISS index (L2)
        index = faiss.IndexFlatL2(_VECTOR_DIM)
        index.add(embeddings)
        _FAISS_INDEX = index
        _INDEX = index
        return

    # If faiss missing but sentence-transformers available -> use sklearn NN on dense embeddings
    if ST_AVAILABLE and not FAISS_AVAILABLE:
        _EMB_METHOD = "sentence-nn"
        _ST_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        embeddings = _ST_MODEL.encode(corpus, convert_to_numpy=True, show_progress_bar=False)
        _VECTOR_DIM = embeddings.shape[1]
        _NN_MODEL = NearestNeighbors(n_neighbors=min(10, len(corpus)), metric='cosine').fit(embeddings)
        _INDEX = (_NN_MODEL, embeddings)
        return

    # Fallback: TF-IDF + sklearn NearestNeighbors
    _EMB_METHOD = "tfidf-nn"
    _TFIDF_VECT = TfidfVectorizer(max_features=512)
    X = _TFIDF_VECT.fit_transform(corpus)
    _VECTOR_DIM = X.shape[1]
    _NN_MODEL = NearestNeighbors(n_neighbors=min(10, X.shape[0]), metric='cosine').fit(X)
    _INDEX = (_NN_MODEL, X)
    return

def _encode_queries(queries: List[str]):
    """
    Returns numpy array (n, d) depending on chosen method
    """
    global _EMB_METHOD, _ST_MODEL, _TFIDF_VECT
    if _EMB_METHOD is None:
        build_index()
    if _EMB_METHOD.startswith("sentence"):
        embs = _ST_MODEL.encode(queries, convert_to_numpy=True, show_progress_bar=False)
        return np.asarray(embs, dtype='float32')
    else:
        # _INDEX stores TFIDF in second pos for fallback
        Xq = _TFIDF_VECT.transform(queries)
        return Xq

def search_similar_by_text(query_text: str, top_k: int = 3):
    """
    Returns list of item meta for top_k similar items to the query_text
    """
    global _INDEX, _ITEM_IDS, _ITEM_META, _EMB_METHOD, _FAISS_INDEX, _NN_MODEL

    if _INDEX is None:
        build_index()

    # If FAISS index exists
    if FAISS_AVAILABLE and _EMB_METHOD == "sentence-faiss":
        qv = _ST_MODEL.encode([query_text], convert_to_numpy=True, show_progress_bar=False).astype('float32')
        D, I = _FAISS_INDEX.search(qv, top_k)
        results = []
        for idx in I[0]:
            results.append(_ITEM_META[idx])
        return results

    # If sentence-nn or tfidf-nn fallback using sklearn
    if _EMB_METHOD in ("sentence-nn", "tfidf-nn"):
        qv = _encode_queries([query_text])
        nn_model = _INDEX[0]
        X_store = _INDEX[1]
        # Note: scikit expects 2D arrays; for sparse TFIDF, qv is sparse matrix
        distances, indices = nn_model.kneighbors(qv, n_neighbors=min(top_k, len(_ITEM_META)))
        results = []
        for idx in indices[0]:
            results.append(_ITEM_META[idx])
        return results

    # final fallback: return top menu entries
    return _ITEM_META[:top_k]

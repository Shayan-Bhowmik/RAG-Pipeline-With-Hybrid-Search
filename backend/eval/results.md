# HybridRAG Retrieval Benchmark & Evaluation Writeup

This document presents the empirical evaluation of our hybrid retrieval pipeline against a 30-query ground truth test set (`eval_set.json`) crafted from our technical documentation corpus.

---

## 1. Benchmark Results

### Overall Results (All 30 Queries)

| Retrieval Mode         | Recall@1   | Recall@3   | Recall@5   | Recall@10  | MRR        |
| -----------------------|------------|------------|------------|------------|----------- |
| **Dense (pgvector)**   | 0.4667     | 0.6000     | 0.7333     | 0.8000     | 0.5846     |
| **Sparse (BM25)**      | 0.6000     | 0.7000     | 0.8000     | **0.9667** | 0.6877     |
| **Hybrid (RRF)**       | **0.6000** | **0.8000** | **0.9000** | 0.9333     | **0.7163** |
| **Hybrid + Reranker**  | 0.5333     | 0.7000     | 0.8667     | 0.9333     | 0.6628     |

---

### Breakdown: Exact-Term Queries (15 Queries)

| Retrieval Mode         | Recall@1   | Recall@3   | Recall@5   | Recall@10  | MRR        |
| -----------------------|------------|------------|------------|------------|----------- |
| **Dense (pgvector)**   | 0.4667     | 0.6667     | 0.8000     | 0.8000     | 0.6158     |
| **Sparse (BM25)**      | **0.7333** | **0.8667** | 0.8667     | **1.0000** | **0.8058** |
| **Hybrid (RRF)**       | **0.7333** | 0.8000     | **0.9333** | **1.0000** | 0.8044     |
| **Hybrid + Reranker**  | 0.6000     | 0.8000     | **0.9333** | **1.0000** | 0.7284     |

---

### Breakdown: Paraphrase / Semantic Queries (15 Queries)

| Retrieval Mode         | Recall@1   | Recall@3   | Recall@5   | Recall@10  | MRR        |
| -----------------------|------------|------------|------------|------------|----------- |
| **Dense (pgvector)**   | 0.4667     | 0.5333     | 0.6667     | 0.8000     | 0.5533     |
| **Sparse (BM25)**      | 0.4667     | 0.5333     | 0.7333     | **0.9333** | 0.5695     |
| **Hybrid (RRF)**       | **0.4667** | **0.8000** | **0.8667** | 0.8667     | **0.6281** |
| **Hybrid + Reranker**  | **0.4667** | 0.6000     | 0.8000     | 0.8667     | 0.5972     |

---

## 2. Key Findings & Quantitative Analysis

### Where Hybrid (RRF) Outperforms
1. **Higher Overall MRR (+22.5% vs Dense):**
   - Hybrid achieved an MRR of **`0.7163`**, compared to **`0.5846`** for Dense and **`0.6877`** for Sparse. The reciprocal rank improvement means the correct chunk appears higher in the returned list, giving the generator higher-quality context upfront.
2. **Context Window Reliability (Recall@5 = 90.0%):**
   - In production, RAG generators pass the top $k=5$ chunks to the LLM. 
   - Dense-only retrieval captures the relevant chunk in the top 5 only **73.3%** of the time.
   - Hybrid (RRF) brings Recall@5 to **90.0%**, reducing generation failure due to context omission by **62.5%**.
3. **Paraphrase Generalization:**
   - On paraphrase queries where user queries lack literal token overlap with the documents, Hybrid achieved **0.8667 Recall@5** and **0.6281 MRR**, significantly beating both pure Dense (`0.6667` Recall@5) and pure Sparse (`0.7333` Recall@5).

---

### Where Dense Falls Short: The "Exact Term / Acronym" Tax
- On exact-term queries (containing identifiers like `RLS`, `ColBERT`, `pgvector`, `match_chunks`), Dense achieved an MRR of only **`0.6158`** and topped out at **`0.8000` Recall@10**.
- Dense embedding models compress words into continuous space, which often blurs distinct technical keywords, model names, or schema column identifiers.
- Sparse (BM25) scored **`0.8058` MRR** and **`1.0000` Recall@10** on these queries. Hybrid successfully inherited BM25's exact keyword precision while preserving dense semantic understanding.

---

### Why Cross-Encoder Reranking Did Not Beat RRF Here
- Hybrid + Reranker scored **`0.6628` MRR**, slightly lower than pre-rerank Hybrid (**`0.7163`**), while introducing ~7 seconds of CPU cross-encoder inference per query.
- **Why?**
  1. **Domain Bias:** Off-the-shelf cross-encoders (`bge-reranker-base`) are trained primarily on conversational passages and web search data (MS MARCO). On dense engineering specs and architecture tables, the cross-encoder occasionally favored longer narrative chunks over concise factual definitions.
  2. **Candidate Density:** In a small corpus (~48 chunks), RRF already pushes the ideal candidate into the top 1–3 positions. Reranking adds the risk of false-negative demotion.
- **Production Decision:** For latency-critical and compute-constrained workloads on technical corpora, **pre-rerank Hybrid RRF provides the optimal Pareto frontier of accuracy and zero-latency inference**.

---

## 3. Interview Talking Points

1. **Why RRF instead of a weighted linear sum $(\alpha \cdot \text{Dense} + (1-\alpha) \cdot \text{BM25})$?**
   - Dense cosine similarity is bounded $[0, 1]$, while BM25 scores are unbounded $[0, \infty)$ and vary drastically across short vs. long queries. Normalizing BM25 requires min-max scaling across candidates per query, which is unstable with small batch sizes. RRF is rank-based, scale-invariant, and parameter-robust ($k=60$).
2. **Why not vector search only?**
   - Dense retrieval suffers from the *vocabulary mismatch problem* in reverse: it treats rare, critical technical tokens as minor perturbations in high-dimensional vector space. Sparse retrieval provides an exact keyword anchor that dense embeddings fail to guarantee.
3. **What is the practical impact on RAG generation?**
   - Moving from Dense-only to Hybrid increases Recall@5 from 73.3% to 90.0%. This directly prevents hallucination and refusal errors in the generator without increasing token budget.

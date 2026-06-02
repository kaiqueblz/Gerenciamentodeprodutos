import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000/api/produtos";

const CATEGORIAS_CORES = {
  "Eletrônicos": "#3b82f6",
  "Periféricos": "#8b5cf6",
  "Monitores": "#06b6d4",
  "Mobiliário": "#f59e0b",
  "default": "#6b7280",
};

const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const emptyForm = { nome: "", descricao: "", preco: "", estoque: "", categoria: "" };

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // null | 'criar' | 'editar' | 'deletar'
  const [selecionado, setSelecionado] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [erro, setErro] = useState("");
  const [toast, setToast] = useState(null);

  const pageSize = 6;

  const showToast = (msg, tipo = "sucesso") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, pageSize });
      if (search) params.append("search", search);
      if (categoriaFiltro) params.append("categoria", categoriaFiltro);
      const res = await fetch(`${API_BASE}?${params}`);
      const data = await res.json();
      setProdutos(data.items);
      setTotal(data.total);
    } catch {
      showToast("Erro ao conectar na API. Verifique se o backend está rodando.", "erro");
    } finally {
      setLoading(false);
    }
  }, [page, search, categoriaFiltro]);

  const fetchCategorias = async () => {
    try {
      const res = await fetch(`${API_BASE}/categorias`);
      const data = await res.json();
      setCategorias(data);
    } catch {}
  };

  useEffect(() => { fetchProdutos(); }, [fetchProdutos]);
  useEffect(() => { fetchCategorias(); }, []);

  const abrirCriar = () => {
    setForm(emptyForm);
    setErro("");
    setModal("criar");
  };

  const abrirEditar = (p) => {
    setSelecionado(p);
    setForm({ nome: p.nome, descricao: p.descricao || "", preco: p.preco, estoque: p.estoque, categoria: p.categoria || "" });
    setErro("");
    setModal("editar");
  };

  const abrirDeletar = (p) => {
    setSelecionado(p);
    setModal("deletar");
  };

  const fecharModal = () => { setModal(null); setSelecionado(null); setErro(""); };

  const salvar = async () => {
    if (!form.nome.trim()) return setErro("Nome é obrigatório.");
    if (!form.preco || isNaN(form.preco) || Number(form.preco) <= 0) return setErro("Preço deve ser maior que zero.");
    setErro("");
    const body = { ...form, preco: Number(form.preco), estoque: Number(form.estoque) || 0 };
    try {
      const url = modal === "editar" ? `${API_BASE}/${selecionado.id}` : API_BASE;
      const method = modal === "editar" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      showToast(modal === "editar" ? "Produto atualizado!" : "Produto criado!");
      fecharModal();
      fetchProdutos();
      fetchCategorias();
    } catch {
      setErro("Erro ao salvar. Verifique os dados.");
    }
  };

  const deletar = async () => {
    try {
      await fetch(`${API_BASE}/${selecionado.id}`, { method: "DELETE" });
      showToast("Produto removido.", "aviso");
      fecharModal();
      fetchProdutos();
    } catch {
      showToast("Erro ao deletar.", "erro");
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const corCategoria = (cat) => CATEGORIAS_CORES[cat] || CATEGORIAS_CORES.default;

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", color: "#e8e6e1", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#17171f", borderBottom: "1px solid #2a2a36", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366f1, #a78bfa)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📦</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px" }}>Gestão de Produtos</span>
          <span style={{ background: "#1e1e2e", border: "1px solid #2a2a36", borderRadius: 20, padding: "2px 10px", fontSize: 12, color: "#6366f1" }}>v1.0</span>
        </div>
        <button onClick={abrirCriar} style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", border: "none", borderRadius: 8, padding: "8px 18px", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          + Novo Produto
        </button>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total de Produtos", valor: total, icon: "📦", cor: "#6366f1" },
            { label: "Categorias", valor: categorias.length, icon: "🏷️", cor: "#a78bfa" },
            { label: "Página Atual", valor: `${page} / ${totalPages || 1}`, icon: "📄", cor: "#06b6d4" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#17171f", border: "1px solid #2a2a36", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.cor }}>{s.valor}</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍  Buscar por nome ou descrição..."
            style={{ flex: 1, minWidth: 240, background: "#17171f", border: "1px solid #2a2a36", borderRadius: 8, padding: "10px 14px", color: "#e8e6e1", fontSize: 14, outline: "none" }}
          />
          <select
            value={categoriaFiltro}
            onChange={(e) => { setCategoriaFiltro(e.target.value); setPage(1); }}
            style={{ background: "#17171f", border: "1px solid #2a2a36", borderRadius: 8, padding: "10px 14px", color: categoriaFiltro ? "#e8e6e1" : "#6b7280", fontSize: 14, outline: "none", minWidth: 180 }}
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Tabela */}
        <div style={{ background: "#17171f", border: "1px solid #2a2a36", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1e1e2e", borderBottom: "1px solid #2a2a36" }}>
                {["ID", "Produto", "Categoria", "Preço", "Estoque", "Ações"].map((h) => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: "center", color: "#6b7280" }}>Carregando...</td></tr>
              ) : produtos.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: "center", color: "#6b7280" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
                  <div>Nenhum produto encontrado</div>
                </td></tr>
              ) : produtos.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #1e1e2e", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a1a24"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "16px 20px", color: "#4b5563", fontSize: 13 }}>#{p.id}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
                    {p.descricao && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.descricao}</div>}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    {p.categoria ? (
                      <span style={{ background: corCategoria(p.categoria) + "22", color: corCategoria(p.categoria), borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{p.categoria}</span>
                    ) : <span style={{ color: "#4b5563" }}>—</span>}
                  </td>
                  <td style={{ padding: "16px 20px", fontWeight: 700, color: "#4ade80", fontSize: 15 }}>{formatBRL(p.preco)}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ color: p.estoque === 0 ? "#ef4444" : p.estoque < 5 ? "#f59e0b" : "#6b7280", fontWeight: 600 }}>{p.estoque} un.</span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => abrirEditar(p)} style={{ background: "#1e1e2e", border: "1px solid #2a2a36", borderRadius: 6, padding: "6px 12px", color: "#a78bfa", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>✏️ Editar</button>
                      <button onClick={() => abrirDeletar(p)} style={{ background: "#1e1e2e", border: "1px solid #2a2a36", borderRadius: 6, padding: "6px 12px", color: "#f87171", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ background: "#17171f", border: "1px solid #2a2a36", borderRadius: 8, padding: "8px 16px", color: page === 1 ? "#4b5563" : "#e8e6e1", cursor: page === 1 ? "default" : "pointer", fontSize: 14 }}>← Anterior</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ background: page === p ? "#6366f1" : "#17171f", border: `1px solid ${page === p ? "#6366f1" : "#2a2a36"}`, borderRadius: 8, padding: "8px 14px", color: "#e8e6e1", cursor: "pointer", fontSize: 14, fontWeight: page === p ? 700 : 400 }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ background: "#17171f", border: "1px solid #2a2a36", borderRadius: 8, padding: "8px 16px", color: page === totalPages ? "#4b5563" : "#e8e6e1", cursor: page === totalPages ? "default" : "pointer", fontSize: 14 }}>Próxima →</button>
          </div>
        )}
      </main>

      {/* Modal Criar/Editar */}
      {(modal === "criar" || modal === "editar") && (
        <div style={{ position: "fixed", inset: 0, background: "#000000bb", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 24 }}>
          <div style={{ background: "#17171f", border: "1px solid #2a2a36", borderRadius: 16, padding: 32, width: "100%", maxWidth: 520 }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700 }}>{modal === "criar" ? "➕ Novo Produto" : "✏️ Editar Produto"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Nome *", key: "nome", placeholder: "Ex: Notebook Dell XPS 15", type: "text" },
                { label: "Descrição", key: "descricao", placeholder: "Descrição breve do produto", type: "text" },
                { label: "Preço (R$) *", key: "preco", placeholder: "0.00", type: "number" },
                { label: "Estoque", key: "estoque", placeholder: "0", type: "number" },
                { label: "Categoria", key: "categoria", placeholder: "Ex: Eletrônicos", type: "text" },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, color: "#9ca3af", marginBottom: 6, display: "block" }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: "100%", background: "#0f0f13", border: "1px solid #2a2a36", borderRadius: 8, padding: "10px 14px", color: "#e8e6e1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
            {erro && <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginTop: 16 }}>{erro}</div>}
            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={fecharModal} style={{ background: "transparent", border: "1px solid #2a2a36", borderRadius: 8, padding: "10px 20px", color: "#9ca3af", cursor: "pointer", fontSize: 14 }}>Cancelar</button>
              <button onClick={salvar} style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                {modal === "criar" ? "Criar Produto" : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Deletar */}
      {modal === "deletar" && selecionado && (
        <div style={{ position: "fixed", inset: 0, background: "#000000bb", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 24 }}>
          <div style={{ background: "#17171f", border: "1px solid #2a2a36", borderRadius: 16, padding: 32, width: "100%", maxWidth: 420, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Remover Produto</h2>
            <p style={{ color: "#9ca3af", marginBottom: 8 }}>Tem certeza que deseja remover</p>
            <p style={{ color: "#e8e6e1", fontWeight: 600, marginBottom: 24 }}>"{selecionado.nome}"?</p>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>Essa ação não pode ser desfeita.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={fecharModal} style={{ background: "transparent", border: "1px solid #2a2a36", borderRadius: 8, padding: "10px 20px", color: "#9ca3af", cursor: "pointer", fontSize: 14 }}>Cancelar</button>
              <button onClick={deletar} style={{ background: "linear-gradient(135deg, #ef4444, #f87171)", border: "none", borderRadius: 8, padding: "10px 24px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Sim, remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.tipo === "sucesso" ? "#166534" : toast.tipo === "aviso" ? "#92400e" : "#7f1d1d", border: `1px solid ${toast.tipo === "sucesso" ? "#4ade80" : toast.tipo === "aviso" ? "#f59e0b" : "#ef4444"}`, borderRadius: 10, padding: "14px 20px", color: "#fff", fontWeight: 500, fontSize: 14, zIndex: 100, maxWidth: 360 }}>
          {toast.tipo === "sucesso" ? "✅" : toast.tipo === "aviso" ? "⚠️" : "❌"} {toast.msg}
        </div>
      )}
    </div>
  );
}

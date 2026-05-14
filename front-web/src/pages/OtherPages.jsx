// ─── pages/OtherPages.jsx ─────────────────────────────────────────────────────
// Notes · Planning · Infos · Utilisateurs
import { useState, useEffect, useCallback, useRef } from "react";
import { T, FILIERES, NIVEAUX, SITES, SEMESTRES } from "../theme.js";
import {
  Card, Btn, Input, Modal, Spinner, EmptyState,
  SectionTitle, Pill, Divider,
} from "../components/ui.jsx";
import {
  getUsers, createUser, updateRole, toggleSuspend, deleteUser,
  getNotesEtudiant, createNote,
  getClasses, getPlanningClasse, updateSeance, getSalles,
  createSalle, deleteSalle, uploadPlanning,
  getInfos, createInfo, deleteInfo,
} from "../api.js";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  PAGE NOTES                                                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
export function PageNotes({ token, showToast }) {
  const [etudiants, setEtudiants] = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [notes,     setNotes]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState({ matiere: "", note: "", semestre: "S1", matricule: "" });
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    getUsers(token, "etudiant")
      .then(setEtudiants)
      .catch(e => showToast?.("❌ " + e.message, "error"));
  }, [token]);

  const loadNotes = async (u) => {
    setSelected(u); setLoading(true);
    try {
      const d = await getNotesEtudiant(token, u.id);
      setNotes(d.notes || []);
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    try {
      await createNote(token, {
        matiere: form.matiere,
        note: parseFloat(form.note),
        semestre: form.semestre,
        ...(form.matricule
          ? { matricule_etudiant: form.matricule.toUpperCase() }
          : selected ? { user_id: selected.id } : {}),
      });
      showToast?.("✅ Note ajoutée", "success");
      setModal(false);
      setForm({ matiere: "", note: "", semestre: "S1", matricule: "" });
      if (selected) loadNotes(selected);
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
  };

  const filtered = etudiants.filter(u =>
    `${u.prenom} ${u.nom} ${u.matricule} ${u.classe || ""}`.toLowerCase()
      .includes(search.toLowerCase())
  );

  // Stats notes
  const moyenne    = notes.length ? (notes.reduce((a, n) => a + n.note, 0) / notes.length).toFixed(2) : null;
  const parSem     = notes.reduce((acc, n) => {
    acc[n.semestre] = acc[n.semestre] || [];
    acc[n.semestre].push(n.note);
    return acc;
  }, {});
  const moyParSem  = Object.entries(parSem).map(([s, vals]) => ({
    sem: s, moy: (vals.reduce((a, v) => a + v, 0) / vals.length).toFixed(2),
  }));

  return (
    <div>
      <SectionTitle action={<Btn onClick={() => setModal(true)}>+ Ajouter une note</Btn>}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>Notes</h2>
        <span style={{ fontSize: 13, color: T.sub }}>{etudiants.length} étudiant(s)</span>
      </SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 14 }}>
        {/* ── Liste étudiants ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Rechercher…"
              style={{ width: "100%", padding: "9px 13px", borderRadius: 9,
                border: `1px solid ${T.border}`, background: T.card, color: T.text,
                fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <Card padding={0} style={{ maxHeight: 560, overflowY: "auto" }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`,
              fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.07em" }}>
              ÉTUDIANTS ({filtered.length})
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: T.muted, fontSize: 12 }}>
                Aucun résultat
              </div>
            ) : filtered.map(u => (
              <div key={u.id} onClick={() => loadNotes(u)} style={{
                padding: "10px 14px", cursor: "pointer",
                borderBottom: `1px solid ${T.border}`,
                background: selected?.id === u.id ? T.cardHover : "transparent",
                transition: "background 0.12s",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                  {u.prenom} {u.nom}
                </div>
                <div style={{ fontSize: 10, color: T.sub }}>
                  {u.matricule} · {u.classe || "Classe ?"}
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* ── Notes ── */}
        <Card>
          {!selected ? (
            <EmptyState icon="👆" message="Sélectionnez un étudiant pour voir ses notes" />
          ) : loading ? (
            <Spinner />
          ) : (
            <div>
              {/* Header étudiant */}
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: "0 0 4px" }}>
                    {selected.prenom} {selected.nom}
                  </h3>
                  <div style={{ fontSize: 12, color: T.sub }}>
                    {selected.matricule} · {selected.classe || "—"} · {selected.filiere || "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 32, fontWeight: 900,
                    color: moyenne >= 10 ? T.green : T.red, lineHeight: 1 }}>
                    {moyenne || "—"}
                    <span style={{ fontSize: 16, color: T.sub }}>/20</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub }}>Moyenne générale</div>
                  {/* Moyennes par semestre */}
                  {moyParSem.map(({ sem, moy }) => (
                    <div key={sem} style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                      {sem} : <span style={{ color: moy >= 10 ? T.green : T.red }}>{moy}/20</span>
                    </div>
                  ))}
                </div>
              </div>

              {notes.length === 0 ? (
                <EmptyState icon="📝" message="Aucune note pour cet étudiant" action={
                  <Btn small onClick={() => setModal(true)}>+ Saisir une note</Btn>
                } />
              ) : (
                <>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 10, marginBottom: 16,
                  }}>
                    {notes.map(n => (
                      <div key={n.id} style={{
                        padding: "12px 14px", borderRadius: 12,
                        background: n.note >= 10 ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
                        border: `1px solid ${n.note >= 10 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}>
                        <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>
                          {n.semestre}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>
                          {n.matiere}
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900,
                          color: n.note >= 10 ? T.green : T.red, lineHeight: 1 }}>
                          {n.note}
                          <span style={{ fontSize: 13, color: T.sub }}>/20</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Btn small onClick={() => setModal(true)}>
                    + Ajouter une note à {selected.prenom}
                  </Btn>
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Modal ajout note */}
      <Modal open={modal} onClose={() => setModal(false)} title="Ajouter une note">
        <Input label="Matricule étudiant (laisser vide si déjà sélectionné)"
          value={form.matricule} onChange={v => setForm(p => ({ ...p, matricule: v }))}
          placeholder={selected ? `${selected.matricule} (auto)` : "Ex: AFI-042"} />
        <Input label="Matière *" value={form.matiere}
          onChange={v => setForm(p => ({ ...p, matiere: v }))}
          placeholder="Ex: Mathématiques" required />
        <Input label="Note (0 – 20) *" type="number" value={form.note}
          onChange={v => setForm(p => ({ ...p, note: v }))}
          placeholder="Ex: 14.5" required />
        <Input label="Semestre" value={form.semestre}
          onChange={v => setForm(p => ({ ...p, semestre: v }))}
          options={SEMESTRES} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
          <Btn onClick={addNote} disabled={!form.matiere || !form.note}>
            Enregistrer la note
          </Btn>
        </div>
      </Modal>

// ─── pages/OtherPages.jsx — Campus Voice v4.3 ────────────────────────────────
// Fixes :
//   • Création utilisateur : /register (form-urlencoded, username=matricule, role=etudiant)
//                            /admin/creer (JSON, role=admin|admin_general)
//   • Rôle : PATCH /users/{id}/role n'existe PAS dans ce backend → changement via /admin/creer
//   • Notes : sélecteur filière→classe→étudiant + formulaire intégré dans le panel
//   • Planning : date picker natif + heure picker + modification complète
//   • Infos : multipart/form-data image+vidéo + édition
//   • Utilisateurs : fiche détaillée + filtres avancés + modification inline
import { useState, useEffect, useCallback, useRef } from "react";
import { T, FILIERES, NIVEAUX, SITES } from "../theme.js";

const BASE = import.meta.env.VITE_API_URL || "https://campus-voice-8d0u.onrender.com";

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function apiFetch(url, opts = {}, token) {
  const headers = { ...(opts.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(opts.body instanceof FormData) && !(opts.body instanceof URLSearchParams)) {
    headers["Content-Type"] = "application/json";
  }
  const r = await fetch(BASE + url, { ...opts, headers });
  if (!r.ok) {
    let msg = `Erreur ${r.status}`;
    try { const d = await r.json(); msg = d.detail || msg; } catch (_) {}
    throw new Error(msg);
  }
  return r.json();
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
const C = {
  inp: {
    width: "100%", padding: "9px 13px", borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.sidebar,
    color: T.text, fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s",
  },
  label: {
    fontSize: 10, color: T.sub, display: "block",
    marginBottom: 6, fontWeight: 700, letterSpacing: "0.07em",
  },
  card: {
    background: T.card, borderRadius: 16,
    border: `1px solid ${T.border}`, padding: 20,
  },
};

function btn(variant = "primary", extra = {}) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer",
    fontFamily: "inherit", fontWeight: 600, fontSize: 13, transition: "all 0.15s", ...extra,
  };
  const v = {
    primary:   { background: "linear-gradient(135deg,#C8102E,#8B0000)", color: "#fff", boxShadow: "0 4px 14px rgba(200,16,46,0.3)" },
    ghost:     { background: "transparent", color: T.sub, border: `1px solid ${T.border}` },
    danger:    { background: "rgba(239,68,68,0.12)", color: "#F87171", border: "1px solid rgba(239,68,68,0.22)" },
    success:   { background: "rgba(16,185,129,0.12)", color: "#34D399", border: "1px solid rgba(16,185,129,0.22)" },
    secondary: { background: T.cardHover, color: T.text, border: `1px solid ${T.border}` },
  };
  return { ...base, ...(v[variant] || v.primary) };
}

function Field({ label, children, mb = 14 }) {
  return (
    <div style={{ marginBottom: mb }}>
      {label && <label style={C.label}>{label}</label>}
      {children}
    </div>
  );
}

function Inp({ label, value, onChange, type = "text", placeholder, disabled,
  options, rows, required, small, mb }) {
  const style = { ...C.inp, padding: small ? "6px 10px" : C.inp.padding, opacity: disabled ? 0.5 : 1 };
  return (
    <Field label={label} mb={mb ?? 14}>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          disabled={disabled} style={style} required={required}>
          <option value="">— Choisir —</option>
          {options.map(o => <option key={o.v ?? o} value={o.v ?? o}>{o.l ?? o}</option>)}
        </select>
      ) : rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
          placeholder={placeholder} style={{ ...style, resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled} required={required} style={style}
          onFocus={e => e.target.style.borderColor = `${T.blue}70`}
          onBlur={e => e.target.style.borderColor = T.border} />
      )}
    </Field>
  );
}

// Date + heure pickers avec bouton calendrier/horloge
function DatePicker({ label, value, onChange, required }) {
  const ref = useRef();
  return (
    <Field label={label}>
      <div style={{ display: "flex", gap: 6 }}>
        <input type="date" value={value} onChange={e => onChange(e.target.value)}
          ref={ref} required={required}
          style={{ ...C.inp, flex: 1, colorScheme: "dark" }}
          onFocus={e => e.target.style.borderColor = `${T.blue}70`}
          onBlur={e => e.target.style.borderColor = T.border} />
        <button type="button" onClick={() => ref.current?.showPicker?.()}
          style={{ ...btn("ghost"), padding: "8px 12px", fontSize: 16 }}>📅</button>
      </div>
    </Field>
  );
}

function TimePicker({ label, value, onChange }) {
  const ref = useRef();
  return (
    <Field label={label}>
      <div style={{ display: "flex", gap: 6 }}>
        <input type="time" value={value} onChange={e => onChange(e.target.value)}
          ref={ref}
          style={{ ...C.inp, flex: 1, colorScheme: "dark" }}
          onFocus={e => e.target.style.borderColor = `${T.blue}70`}
          onBlur={e => e.target.style.borderColor = T.border} />
        <button type="button" onClick={() => ref.current?.showPicker?.()}
          style={{ ...btn("ghost"), padding: "8px 12px", fontSize: 16 }}>🕐</button>
      </div>
    </Field>
  );
}

function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000, padding: 20, backdropFilter: "blur(3px)" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.card, borderRadius: 20, border: `1px solid ${T.border}`,
        width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto",
        padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none",
            color: T.sub, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Spinner({ msg = "Chargement…" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 48, gap: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%",
        border: `2px solid ${T.border}`, borderTop: `2px solid ${T.accent}`,
        animation: "cv-spin 0.7s linear infinite" }} />
      <span style={{ fontSize: 13, color: T.sub }}>{msg}</span>
    </div>
  );
}

function Empty({ icon = "📭", msg, action }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: action ? 16 : 0 }}>{msg}</div>
      {action}
    </div>
  );
}

function G2({ children, gap = 16 }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `0 ${gap}px` }}>{children}</div>;
}

function SectionHdr({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between",
      alignItems: "flex-end", marginBottom: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text,
          margin: "0 0 4px", letterSpacing: -0.5 }}>{title}</h2>
        {sub && <p style={{ fontSize: 13, color: T.sub, margin: 0 }}>{sub}</p>}
      </div>
      {action && <div style={{ display: "flex", gap: 10 }}>{action}</div>}
    </div>
  );
}


// ║  PAGE PLANNING                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
const STATUT_SEANCE_COLOR = {
  programme:  T.cyan,
  en_ligne:   T.blue,
  annule:     T.red,
  reporte:    T.orange,
      
// ║  PAGE NOTES                                                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
export function PageNotes({ token, showToast }) {
  const [filieres,  setFilieres]  = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [selFil,    setSelFil]    = useState("");
  const [selCls,    setSelCls]    = useState("");
  const [search,    setSearch]    = useState("");
  const [selEtu,    setSelEtu]    = useState(null);
  const [notes,     setNotes]     = useState([]);
  const [loading,   setLoading]   = useState(false);

  // Formulaire ajout note (intégré dans le panel)
  const [noteForm,  setNoteForm]  = useState({ matiere: "", note: "", semestre: "S1" });
  const [addingNote,setAddingNote]= useState(false);
  const [showForm,  setShowForm]  = useState(false);

  // Édition d'une note existante
  const [editNote,  setEditNote]  = useState(null); // {id, matiere, note, semestre}

  useEffect(() => {
    apiFetch("/notes/filieres", {}, token)
      .then(setFilieres).catch(() => setFilieres([]));
  }, [token]);

  useEffect(() => {
    if (!selFil && !selCls) { setEtudiants([]); return; }
    const q = new URLSearchParams();
    if (selFil) q.set("filiere", selFil);
    if (selCls) q.set("classe",  selCls);
    apiFetch(`/notes/etudiants?${q}`, {}, token)
      .then(setEtudiants).catch(() => setEtudiants([]));
  }, [selFil, selCls, token]);

  const loadNotes = useCallback(async (etu) => {
    setSelEtu(etu); setLoading(true); setShowForm(false); setEditNote(null);
    try {
      const d = await apiFetch(`/notes/etudiant/${etu.id}`, {}, token);
      setNotes(d.notes || []);
    } catch { setNotes([]); }
    finally { setLoading(false); }
  }, [token]);

  const ajouterNote = async () => {
    if (!selEtu) return showToast?.("Sélectionnez un étudiant", "warning");
    if (!noteForm.matiere || noteForm.note === "") return showToast?.("Matière et note requis", "warning");
    const val = parseFloat(noteForm.note);
    if (isNaN(val) || val < 0 || val > 20) return showToast?.("Note entre 0 et 20", "warning");
    setAddingNote(true);
    try {
      await apiFetch("/notes", {
        method: "POST",
        body: JSON.stringify({ matiere: noteForm.matiere, note: val,
          semestre: noteForm.semestre, user_id: selEtu.id }),
      }, token);
      showToast?.("✅ Note ajoutée", "success");
      setNoteForm({ matiere: "", note: "", semestre: "S1" });
      setShowForm(false);
      loadNotes(selEtu);
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
    finally { setAddingNote(false); }
  };

  const classesFiliere = filieres.find(f => f.code === selFil)?.classes || [];
  const etudiantsFiltres = etudiants.filter(e =>
    `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase())
  );

  const moyenne = notes.length
    ? (notes.reduce((a, n) => a + n.note, 0) / notes.length).toFixed(2) : null;
  const parSem = notes.reduce((acc, n) => {
    (acc[n.semestre] = acc[n.semestre] || []).push(n.note); return acc;
  }, {});

  return (
    <div>
      <SectionHdr title="Notes" sub={`${etudiantsFiltres.length} étudiant(s)${selFil ? ` · ${selFil}` : ""}`} />

      {/* Sélecteur filière → classe → recherche */}
      <div style={{ ...C.card, marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.sub,
          letterSpacing: "0.07em", marginBottom: 14 }}>
          🎯 SÉLECTION — Filière → Classe → Étudiant
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div>
            <label style={C.label}>ÉTAPE 1 — FILIÈRE</label>
            <select value={selFil} onChange={e => { setSelFil(e.target.value); setSelCls(""); setSelEtu(null); }}
              style={C.inp}>
              <option value="">— Toutes les filières —</option>
              {filieres.map(f => <option key={f.code} value={f.code}>{f.code} — {f.label}</option>)}
            </select>
          </div>
          <div>
            <label style={C.label}>ÉTAPE 2 — CLASSE {!selFil && "(filière d'abord)"}</label>
            <select value={selCls} onChange={e => { setSelCls(e.target.value); setSelEtu(null); }}
              disabled={!selFil} style={{ ...C.inp, opacity: selFil ? 1 : 0.4 }}>
              <option value="">— Toutes les classes —</option>
              {classesFiliere.map(c => (
                <option key={c.classe} value={c.classe}>
                  {c.classe} ({c.nb_etudiants} étudiant{c.nb_etudiants > 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={C.label}>ÉTAPE 3 — RECHERCHE</label>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Nom, prénom ou matricule…"
              disabled={!selFil} style={{ ...C.inp, opacity: selFil ? 1 : 0.4 }} />
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 14 }}>

        {/* Liste étudiants */}
        <div style={{ ...C.card, padding: 0, maxHeight: 600, overflowY: "auto" }}>
          <div style={{ padding: "11px 14px", borderBottom: `1px solid ${T.border}`,
            fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.07em" }}>
            ÉTUDIANTS ({etudiantsFiltres.length})
          </div>
          {!selFil ? (
            <Empty icon="👆" msg="Sélectionnez une filière" />
          ) : etudiantsFiltres.length === 0 ? (
            <Empty icon="🔍" msg="Aucun étudiant trouvé" />
          ) : etudiantsFiltres.map(e => (
            <div key={e.id} onClick={() => loadNotes(e)} style={{
              padding: "10px 14px", cursor: "pointer",
              borderBottom: `1px solid ${T.border}`,
              background: selEtu?.id === e.id ? T.cardHover : "transparent",
              borderLeft: `3px solid ${selEtu?.id === e.id ? T.accent : "transparent"}`,
              transition: "all 0.12s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: "linear-gradient(135deg,#3B82F6,#8B5CF6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#fff",
                }}>
                  {(e.prenom?.[0] || "")}{(e.nom?.[0] || "")}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                    {e.prenom} {e.nom}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted }}>{e.matricule} · {e.classe || "—"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Panel notes */}
        <div style={C.card}>
          {!selEtu ? (
            <Empty icon="📝" msg="Cliquez sur un étudiant pour voir ses notes" />
          ) : loading ? (
            <Spinner msg="Chargement des notes…" />
          ) : (
            <div>
              {/* Header étudiant */}
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: "linear-gradient(135deg,#3B82F6,#8B5CF6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, color: "#fff",
                  }}>
                    {(selEtu.prenom?.[0] || "")}{(selEtu.nom?.[0] || "")}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: "0 0 3px" }}>
                      {selEtu.prenom} {selEtu.nom}
                    </h3>
                    <div style={{ fontSize: 11, color: T.sub }}>
                      {selEtu.matricule} · {selEtu.classe || "—"}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1,
                    color: moyenne >= 10 ? T.green : T.red }}>
                    {moyenne || "—"}<span style={{ fontSize: 15, color: T.sub }}>/20</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.sub }}>Moyenne</div>
                  {Object.entries(parSem).map(([sem, vals]) => {
                    const m = (vals.reduce((a, v) => a + v, 0) / vals.length).toFixed(2);
                    return (
                      <div key={sem} style={{ fontSize: 10, color: T.muted }}>
                        {sem} : <span style={{ color: m >= 10 ? T.green : T.red }}>{m}/20</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bouton ajouter */}
              {!showForm && (
                <div style={{ marginBottom: 16 }}>
                  <button style={btn()} onClick={() => { setShowForm(true); setEditNote(null); }}>
                    + Ajouter une note
                  </button>
                </div>
              )}

              {/* Formulaire ajout inline */}
              {showForm && !editNote && (
                <div style={{ padding: "16px 18px", borderRadius: 12, marginBottom: 16,
                  background: "rgba(59,130,246,0.06)", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.blue,
                    marginBottom: 14, letterSpacing: "0.06em" }}>+ NOUVELLE NOTE</div>
                  <G2>
                    <Inp label="Matière *" value={noteForm.matiere}
                      onChange={v => setNoteForm(p => ({ ...p, matiere: v }))}
                      placeholder="Ex: Mathématiques" mb={12} />
                    <G2>
                      <Inp label="Note (0–20) *" type="number" value={noteForm.note}
                        onChange={v => setNoteForm(p => ({ ...p, note: v }))}
                        placeholder="Ex: 14.5" mb={12} />
                      <Inp label="Semestre" value={noteForm.semestre}
                        onChange={v => setNoteForm(p => ({ ...p, semestre: v }))}
                        options={["S1","S2"]} mb={12} />
                    </G2>
                  </G2>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={btn()} onClick={ajouterNote} disabled={addingNote}>
                      {addingNote ? "Enregistrement…" : "✅ Enregistrer"}
                    </button>
                    <button style={btn("ghost")} onClick={() => setShowForm(false)}>Annuler</button>
                  </div>
                </div>
              )}

              {/* Grille des notes */}
              {notes.length === 0 ? (
                <Empty icon="📭" msg="Aucune note enregistrée" />
              ) : (
                <div style={{ display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(148px,1fr))", gap: 10 }}>
                  {notes.map(n => (
                    <div key={n.id} style={{
                      padding: "12px 14px", borderRadius: 12, position: "relative",
                      background: n.note >= 10 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                      border: `1px solid ${n.note >= 10 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                    }}>
                      <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>{n.semestre}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 6 }}>
                        {n.matiere}
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1,
                        color: n.note >= 10 ? T.green : T.red }}>
                        {n.note}<span style={{ fontSize: 13, color: T.sub }}>/20</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  PAGE PLANNING — date picker + heure picker + modification                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
const STATUT_SEANCE = {
  programme: { color: T.cyan,   label: "Programmé" },
  en_ligne:  { color: T.blue,   label: "En ligne"  },
  annule:    { color: T.red,    label: "Annulé"    },
  reporte:   { color: T.orange, label: "Reporté"   },

};

export function PagePlanning({ token, showToast }) {
  const [classes,    setClasses]    = useState([]);
  const [classe,     setClasse]     = useState("");
  const [seances,    setSeances]    = useState([]);
  const [salles,     setSalles]     = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [editModal,  setEditModal]  = useState(null);
  const [editFrm,    setEditFrm]    = useState({});
  const [salleModal, setSalleModal] = useState(false);
  const [salleFrm,   setSalleFrm]  = useState({ site: "AFI_SIEGE", nom: "", capacite: "30" });
  const [uploadFrm,  setUploadFrm] = useState({ filiere: "SRT", niveau: "M2", semestre: "S1" });
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([getClasses(token), getSalles(token)])
      .then(([cls, sls]) => { setClasses(cls); setSalles(sls); })
      .catch(() => {});
  }, [token]);

  const loadSeances = async (cl) => {
    setClasse(cl); setLoading(true);
    try {
      const d = await getPlanningClasse(token, cl);
      setSeances(d);
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const saveSeance = async () => {
    try {
      await updateSeance(token, editModal.id, editFrm);
      setSeances(prev => prev.map(s => s.id === editModal.id ? { ...s, ...editFrm } : s));
      setEditModal(null);
      showToast?.("✅ Séance mise à jour", "success");
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
  };

  const ajouterSalle = async () => {
    try {
      await createSalle(token, { ...salleFrm, capacite: parseInt(salleFrm.capacite) });
      showToast?.("✅ Salle créée", "success");
      setSalleModal(false);
      const sls = await getSalles(token);
      setSalles(sls);
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
  const [uploadFrm,  setUploadFrm]  = useState({ filiere: "SRT", niveau: "M2", semestre: "S1" });
  const [uploading,  setUploading]  = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([
      apiFetch("/planning/classes", {}, token),
      apiFetch("/salles", {}, token),
    ]).then(([cls, sls]) => { setClasses(cls); setSalles(sls); }).catch(() => {});
  }, [token]);

  const chargerSeances = async (cl) => {
    setClasse(cl); setLoading(true);
    try {
      const d = await apiFetch(`/planning?classe=${encodeURIComponent(cl)}`, {}, token);
      setSeances(Array.isArray(d) ? d : []);
    } catch (e) { showToast?.("❌ " + e.message, "error"); setSeances([]); }
    finally { setLoading(false); }
  };

  const sauvegarderSeance = async () => {
    try {
      const payload = {
        module:   editFrm.module   || undefined,
        prof:     editFrm.prof     || undefined,
        date:     editFrm.date     || undefined,
        heure:    editFrm.heure    || undefined,
        statut:   editFrm.statut   || undefined,
        note:     editFrm.note     || undefined,
        duree:    editFrm.duree    ? parseFloat(editFrm.duree)  : undefined,
        salle_id: editFrm.salle_id ? parseInt(editFrm.salle_id) : undefined,
      };
      // Nettoyer les undefined
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      await apiFetch(`/planning/seance/${editModal.id}`, {
        method: "PATCH", body: JSON.stringify(payload),
      }, token);
      showToast?.("✅ Séance mise à jour", "success");
      setEditModal(null);
      chargerSeances(classe);
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
  };

  const creerSalle = async () => {
    try {
      await apiFetch("/salles", {
        method: "POST",
        body: JSON.stringify({ ...salleFrm, capacite: parseInt(salleFrm.capacite) }),
      }, token);
      showToast?.("✅ Salle créée", "success");
      setSalleModal(false);
      setSalleFrm({ site: "AFI_SIEGE", nom: "", capacite: "30" });
      apiFetch("/salles", {}, token).then(setSalles);
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
  };

  const supprimerSalle = async (id) => {
    try {
      await deleteSalle(token, id);
      setSalles(prev => prev.filter(s => s.id !== id));
      showToast?.("✅ Salle désactivée", "success");
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
  };
  const handleUpload = async (file) => {
    try {
      const d = await uploadPlanning(token, file, uploadFrm);
      showToast?.(`✅ ${d.seances_importees} séance(s) importée(s)`, "success");
      const cls = await getClasses(token);
      setClasses(cls);
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
      await apiFetch(`/salles/${id}`, { method: "DELETE" }, token);
      setSalles(p => p.filter(s => s.id !== id));
      showToast?.("✅ Salle désactivée", "success");
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
  };

  const importerExcel = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("fichier", file);
      const q = new URLSearchParams({
        filiere: uploadFrm.filiere, niveau: uploadFrm.niveau, semestre: uploadFrm.semestre,
      });
      const r = await fetch(`${BASE}/planning/upload?${q}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Erreur import");
      showToast?.(`✅ ${d.seances_importees} séance(s) importée(s) — Classe : ${d.classe}`, "success");
      const cls = await apiFetch("/planning/classes", {}, token);
      setClasses(cls);
      if (d.classe) chargerSeances(d.classe);
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div>
      <SectionTitle action={
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" small onClick={() => setSalleModal(true)}>
            🏛️ Salles ({salles.length})
          </Btn>
        </div>
      }>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>Planning</h2>
        <span style={{ fontSize: 13, color: T.sub }}>{classes.length} classe(s)</span>
      </SectionTitle>

      {/* Import Excel */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.sub,
          letterSpacing: "0.07em", marginBottom: 12 }}>📤 IMPORTER UN PLANNING (.xlsx)</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          {[
            { label: "Filière", key: "filiere", opts: FILIERES.map(f => ({ value: f.code, label: f.code })) },
            { label: "Niveau", key: "niveau",  opts: NIVEAUX.map(n => ({ value: n.code, label: n.code })) },
            { label: "Semestre", key: "semestre", opts: SEMESTRES.map(s => ({ value: s, label: s })) },
          ].map(({ label, key, opts }) => (
            <div key={key} style={{ flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 5, fontWeight: 700, letterSpacing: "0.07em" }}>
                {label.toUpperCase()}
              </div>
              <select value={uploadFrm[key]} onChange={e => setUploadFrm(p => ({ ...p, [key]: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7,
                  border: `1px solid ${T.border}`, background: T.sidebar, color: T.text,
                  fontSize: 12, fontFamily: "inherit" }}>
                {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
            onChange={e => { if (e.target.files[0]) handleUpload(e.target.files[0]); }} />
          <Btn onClick={() => fileRef.current.click()}>📤 Choisir un fichier</Btn>
        </div>
      </Card>

      {/* Contenu */}
      <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 14 }}>
        {/* Classes */}
        <Card padding={0} style={{ maxHeight: 600, overflowY: "auto" }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`,
            fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.07em" }}>
            CLASSES
          </div>
          {classes.length === 0 ? (
            <div style={{ padding: 20, color: T.muted, fontSize: 12, textAlign: "center" }}>
              Aucun planning
            </div>
          ) : classes.map(cl => (
            <div key={cl} onClick={() => loadSeances(cl)} style={{
              padding: "10px 14px", cursor: "pointer",
              borderBottom: `1px solid ${T.border}`,
              background: classe === cl ? T.cardHover : "transparent",
              fontSize: 12, color: classe === cl ? T.text : T.sub,
              fontWeight: classe === cl ? 700 : 400, transition: "all 0.12s",
            }}>{cl}</div>
          ))}
        </Card>

        {/* Séances */}
        <Card padding={0}>
          {!classe ? (
            <EmptyState icon="🗓️" message="Sélectionnez une classe" />
          ) : loading ? <Spinner /> : seances.length === 0 ? (
            <EmptyState icon="📭" message="Aucune séance programmée" />
          ) : seances.map((s, i) => (
            <div key={s.id} style={{
              padding: "12px 18px", alignItems: "center", gap: 12,
              borderBottom: i < seances.length - 1 ? `1px solid ${T.border}` : "none",
              display: "grid", gridTemplateColumns: "1fr 110px 90px 90px 40px",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.module}</div>
                <div style={{ fontSize: 11, color: T.sub }}>
                  {s.ue} · {s.prof || "Prof ?"}
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.sub }}>{s.date || "—"} {s.heure || ""}</div>
              <div style={{ fontSize: 11, color: T.sub }}>{s.salle_nom || "—"}</div>
              <span style={{ fontSize: 11, fontWeight: 600,
                color: STATUT_SEANCE_COLOR[s.statut] || T.sub }}>
                {s.statut}
              </span>
              <button onClick={() => {
                setEditModal(s);
                setEditFrm({ module: s.module, prof: s.prof || "",
                  date: s.date || "", heure: s.heure || "",
                  statut: s.statut, note: s.note || "" });
              }} style={{ background: "none", border: `1px solid ${T.border}`,
                color: T.sub, borderRadius: 6, padding: "4px 8px",
                cursor: "pointer", fontSize: 12 }}>✏️</button>
            </div>
          ))}
        </Card>
      </div>

      {/* Modal edit séance */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Modifier la séance">
        <Input label="Module"     value={editFrm.module || ""}  onChange={v => setEditFrm(p => ({ ...p, module: v }))} />
        <Input label="Professeur" value={editFrm.prof || ""}    onChange={v => setEditFrm(p => ({ ...p, prof: v }))} />
        <Input label="Date (YYYY-MM-DD)" value={editFrm.date || ""} onChange={v => setEditFrm(p => ({ ...p, date: v }))} />
        <Input label="Heure (HH:MM)"     value={editFrm.heure || ""} onChange={v => setEditFrm(p => ({ ...p, heure: v }))} />
        <Input label="Statut" value={editFrm.statut || "programme"}
          onChange={v => setEditFrm(p => ({ ...p, statut: v }))}
          options={["programme", "en_ligne", "annule", "reporte"].map(s => ({ value: s, label: s }))} />
        <Input label="Note / Motif" value={editFrm.note || ""}
          onChange={v => setEditFrm(p => ({ ...p, note: v }))}
          placeholder="Ex: Cours annulé — professeur absent" rows={2} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={() => setEditModal(null)}>Annuler</Btn>
          <Btn onClick={saveSeance}>Enregistrer</Btn>
      <SectionHdr
        title="Planning des cours"
        sub={`${classes.length} classe(s) · ${salles.length} salle(s)`}
        action={
          <button style={btn("ghost")} onClick={() => setSalleModal(true)}>
            🏛️ Gérer les salles
          </button>
        }
      />

      {/* Import Excel */}
      <div style={{ ...C.card, marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.sub,
          letterSpacing: "0.07em", marginBottom: 14 }}>
          📤 IMPORTER UN PLANNING (.xlsx)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          {[
            { k: "filiere",  l: "FILIÈRE",  opts: FILIERES.map(f => ({ v: f.code, l: f.code })) },
            { k: "niveau",   l: "NIVEAU",   opts: NIVEAUX.map(n  => ({ v: n.code, l: n.code })) },
            { k: "semestre", l: "SEMESTRE", opts: [{ v:"S1",l:"S1" }, { v:"S2",l:"S2" }] },
          ].map(({ k, l, opts }) => (
            <div key={k}>
              <label style={C.label}>{l}</label>
              <select value={uploadFrm[k]}
                onChange={e => setUploadFrm(p => ({ ...p, [k]: e.target.value }))}
                style={C.inp}>
                {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
          <div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
              onChange={e => { if (e.target.files[0]) importerExcel(e.target.files[0]); }} />
            <button style={{ ...btn(), opacity: uploading ? 0.6 : 1 }}
              onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "⏳ Import…" : "📤 Choisir fichier"}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: T.muted }}>
          Classe générée automatiquement :{" "}
          <strong style={{ color: T.text }}>{uploadFrm.niveau}-{uploadFrm.filiere}</strong>
        </div>
      </div>

      {/* Corps */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14 }}>
        <div style={{ ...C.card, padding: 0, maxHeight: 600, overflowY: "auto" }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`,
            fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.07em" }}>
            CLASSES ({classes.length})
          </div>
          {classes.length === 0 ? <Empty icon="📚" msg="Importez un planning" /> :
            classes.map(cl => (
              <div key={cl} onClick={() => chargerSeances(cl)} style={{
                padding: "10px 14px", cursor: "pointer",
                borderBottom: `1px solid ${T.border}`,
                background: classe === cl ? T.cardHover : "transparent",
                borderLeft: `3px solid ${classe === cl ? T.accent : "transparent"}`,
                fontSize: 12, color: classe === cl ? T.text : T.sub,
                fontWeight: classe === cl ? 700 : 400,
              }}>{cl}</div>
            ))}
        </div>

        <div style={{ ...C.card, padding: 0 }}>
          {!classe ? <Empty icon="🗓️" msg="Sélectionnez une classe" /> :
            loading ? <Spinner msg="Chargement du planning…" /> :
            seances.length === 0 ? <Empty icon="📭" msg="Aucune séance programmée" /> :
            seances.map((s, i) => {
              const sc = STATUT_SEANCE[s.statut] || { color: T.sub, label: s.statut };
              return (
                <div key={s.id} style={{
                  padding: "12px 18px", borderBottom: i < seances.length - 1 ? `1px solid ${T.border}` : "none",
                  display: "grid", gridTemplateColumns: "1fr 120px 100px 90px 36px",
                  alignItems: "center", gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.module}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{s.ue} · {s.prof || "Prof non défini"}</div>
                    {s.note && <div style={{ fontSize: 10, color: T.orange, marginTop: 2 }}>ℹ️ {s.note}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: T.sub }}>
                    {s.date ? new Date(s.date + "T00:00").toLocaleDateString("fr-FR") : "—"}
                    {s.heure ? ` · ${s.heure}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: T.sub }}>
                    {s.salle || "—"}{s.site ? ` (${s.site.replace("AFI_","")})` : ""}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: sc.color }}>
                    {sc.label}
                  </span>
                  <button onClick={() => {
                    setEditModal(s);
                    setEditFrm({
                      module: s.module || "", prof: s.prof || "",
                      date: s.date || "", heure: s.heure || "",
                      statut: s.statut || "programme", note: s.note || "",
                      duree: String(s.duree || "3"), salle_id: "",
                    });
                  }} style={{ background: "none", border: `1px solid ${T.border}`,
                    color: T.sub, borderRadius: 6, padding: "4px 8px",
                    cursor: "pointer", fontSize: 13 }}>✏️</button>
                </div>
              );
            })}
        </div>
      </div>

      {/* Modal modifier séance — avec date picker + heure picker */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)}
        title={`✏️ Modifier — ${editModal?.module || "Séance"}`} width={580}>
        <G2>
          <Inp label="Module" value={editFrm.module || ""}
            onChange={v => setEditFrm(p => ({ ...p, module: v }))} />
          <Inp label="Professeur" value={editFrm.prof || ""}
            onChange={v => setEditFrm(p => ({ ...p, prof: v }))} />
        </G2>
        <G2>
          <DatePicker label="📅 DATE DU COURS" value={editFrm.date || ""}
            onChange={v => setEditFrm(p => ({ ...p, date: v }))} />
          <TimePicker label="🕐 HEURE DE DÉBUT" value={editFrm.heure || ""}
            onChange={v => setEditFrm(p => ({ ...p, heure: v }))} />
        </G2>
        <G2>
          <Inp label="Durée (heures)" type="number" value={editFrm.duree || "3"}
            onChange={v => setEditFrm(p => ({ ...p, duree: v }))} />
          <Inp label="Salle" value={editFrm.salle_id || ""}
            onChange={v => setEditFrm(p => ({ ...p, salle_id: v }))}
            options={salles.map(sl => ({ v: String(sl.id), l: `${sl.nom} · ${sl.site}` }))} />
        </G2>
        <Inp label="Statut" value={editFrm.statut || "programme"}
          onChange={v => setEditFrm(p => ({ ...p, statut: v }))}
          options={Object.entries(STATUT_SEANCE).map(([k, v]) => ({ v: k, l: v.label }))} />
        <Inp label="Note / Motif" value={editFrm.note || ""}
          onChange={v => setEditFrm(p => ({ ...p, note: v }))}
          placeholder="Ex: Cours annulé — professeur absent" rows={2} mb={20} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={btn("ghost")} onClick={() => setEditModal(null)}>Annuler</button>
          <button style={btn()} onClick={sauvegarderSeance}>💾 Enregistrer</button>
        </div>
      </Modal>

      {/* Modal salles */}
      <Modal open={salleModal} onClose={() => setSalleModal(false)} title="Gestion des salles" width={480}>
        <div style={{ marginBottom: 16, maxHeight: 220, overflowY: "auto" }}>
          {salles.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: 16 }}>
              Aucune salle configurée
            </div>
          ) : salles.map(s => (
            <div key={s.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px", borderRadius: 8, background: T.sidebar,
              marginBottom: 6,
            }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.nom}</span>
                <span style={{ fontSize: 11, color: T.sub }}>
                  {" "}· {s.site} · {s.capacite} places
                </span>
              </div>
              <button onClick={() => supprimerSalle(s.id)}
                style={{ background: "none", border: "none", color: T.muted,
                  cursor: "pointer", fontSize: 14 }}>🗑️</button>
            </div>
          ))}
        </div>
        <Divider />
        <div style={{ fontSize: 11, fontWeight: 700, color: T.sub,
          letterSpacing: "0.07em", marginBottom: 12 }}>NOUVELLE SALLE</div>
        <Input label="Site" value={salleFrm.site}
          onChange={v => setSalleFrm(p => ({ ...p, site: v }))}
          options={SITES.map(s => ({ value: s, label: s }))} />
        <Input label="Nom de la salle" value={salleFrm.nom}
          onChange={v => setSalleFrm(p => ({ ...p, nom: v }))}
          placeholder="Ex: Salle 12" />
        <Input label="Capacité" type="number" value={salleFrm.capacite}
          onChange={v => setSalleFrm(p => ({ ...p, capacite: v }))} />
        <Btn onClick={ajouterSalle} disabled={!salleFrm.nom}>Créer la salle</Btn>
      <Modal open={salleModal} onClose={() => setSalleModal(false)} title="🏛️ Gestion des salles" width={460}>
        <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>
          {salles.length === 0 ? (
            <div style={{ textAlign: "center", padding: 16, color: T.muted, fontSize: 12 }}>
              Aucune salle configurée
            </div>
          ) : salles.map(sl => (
            <div key={sl.id} style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "8px 12px", borderRadius: 8,
              background: T.sidebar, marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{sl.nom}</span>
                <span style={{ fontSize: 11, color: T.sub }}> · {sl.site} · {sl.capacite} places</span>
              </div>
              <button onClick={() => supprimerSalle(sl.id)}
                style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>🗑️</button>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.sub,
            letterSpacing: "0.07em", marginBottom: 12 }}>NOUVELLE SALLE</div>
          <Inp label="Site" value={salleFrm.site} onChange={v => setSalleFrm(p => ({ ...p, site: v }))}
            options={SITES.map(s => ({ v: s, l: s }))} />
          <G2>
            <Inp label="Nom" value={salleFrm.nom}
              onChange={v => setSalleFrm(p => ({ ...p, nom: v }))} placeholder="Ex: Salle 12" />
            <Inp label="Capacité" type="number" value={salleFrm.capacite}
              onChange={v => setSalleFrm(p => ({ ...p, capacite: v }))} />
          </G2>
          <button style={btn()} onClick={creerSalle} disabled={!salleFrm.nom}>
            + Créer la salle
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  PAGE INFOS & NEWS                                                           ║
// ║  PAGE INFOS — multipart/form-data image + vidéo + édition                    ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
export function PageInfos({ token, showToast }) {
  const [infos,   setInfos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({
    titre: "", description: "", lien: "", date_evenement: "", cible: "tous",
  });

  const CIBLES = [
    { value: "tous", label: "Tous les utilisateurs" },
    ...FILIERES.map(f => ({ value: f.code, label: `Filière ${f.code} — ${f.label}` })),
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try { setInfos(await getInfos(token)); }
    catch (e) { showToast?.("❌ " + e.message, "error"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const publish = async () => {
    try {
      await createInfo(token, form);
      showToast?.("✅ Info publiée", "success");
      setModal(false);
      setForm({ titre: "", description: "", lien: "", date_evenement: "", cible: "tous" });
      load();
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
  };

  const remove = async (id) => {
    if (!confirm("Supprimer cette information ?")) return;
    try {
      await deleteInfo(token, id);
      setInfos(prev => prev.filter(i => i.id !== id));
      showToast?.("🗑️ Info supprimée", "success");
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({
    titre: "", description: "", lien: "", date_evenement: "", cible: "tous",
  });
  const [imageFile,    setImageFile]    = useState(null);
  const [videoFile,    setVideoFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imgRef = useRef();
  const vidRef = useRef();

  const CIBLES = [
    { v: "tous", l: "🌍 Tous les utilisateurs" },
    ...FILIERES.map(f => ({ v: f.code, l: `🎓 Filière ${f.code} — ${f.label}` })),
    ...SITES.map(s => ({ v: `site_${s}`, l: `📍 Site ${s}` })),
  ];

  const charger = useCallback(async () => {
    setLoading(true);
    try { setInfos(await apiFetch("/infos", {}, token)); }
    catch { setInfos([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { charger(); }, [charger]);

  const reinit = () => {
    setForm({ titre: "", description: "", lien: "", date_evenement: "", cible: "tous" });
    setImageFile(null); setVideoFile(null); setImagePreview(null);
    if (imgRef.current) imgRef.current.value = "";
    if (vidRef.current) vidRef.current.value = "";
  };

  const publier = async () => {
    if (!form.titre.trim()) return showToast?.("Le titre est obligatoire", "warning");
    setSaving(true);
    try {
      // ✅ POST /infos = multipart/form-data (PAS JSON)
      const fd = new FormData();
      fd.append("titre", form.titre.trim());
      if (form.description)    fd.append("description",    form.description);
      if (form.lien)           fd.append("lien",           form.lien);
      if (form.date_evenement) fd.append("date_evenement", form.date_evenement);
      fd.append("cible", form.cible || "tous");
      if (imageFile) fd.append("image", imageFile);
      if (videoFile) fd.append("video", videoFile);

      const r = await fetch(`${BASE}/infos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Erreur publication");
      showToast?.("✅ Info publiée avec succès", "success");
      setModal(false); reinit(); charger();
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const supprimer = async (id) => {
    if (!confirm("Supprimer cette information définitivement ?")) return;
    try {
      await apiFetch(`/infos/${id}`, { method: "DELETE" }, token);
      setInfos(p => p.filter(i => i.id !== id));
      showToast?.("🗑️ Info supprimée", "success");
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
  };

  const handleImg = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 10 * 1024 * 1024) { showToast?.("❌ Image max 10 Mo", "error"); return; }
    setImageFile(f);
    const r = new FileReader(); r.onload = ev => setImagePreview(ev.target.result); r.readAsDataURL(f);
  };

  const handleVid = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 50 * 1024 * 1024) { showToast?.("❌ Vidéo max 50 Mo", "error"); return; }
    setVideoFile(f);
  };

  return (
    <div>
      <SectionTitle action={<Btn onClick={() => setModal(true)}>📣 Publier une info</Btn>}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>
          Infos & Actualités
        </h2>
        <span style={{ fontSize: 13, color: T.sub }}>{infos.length} publication(s)</span>
      </SectionTitle>

      {loading ? <Spinner /> : infos.length === 0 ? (
        <EmptyState icon="📭" message="Aucune information publiée" action={
          <Btn small onClick={() => setModal(true)}>Publier la première info</Btn>
        } />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 14,
        }}>
          {infos.map(info => (
            <Card key={info.id}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Pill color={T.blue} bg="rgba(59,130,246,0.1)">
                    {info.cible === "tous" ? "🌍 Tous" : `🎯 ${info.cible}`}
                  </Pill>
                  {info.date_evenement && (
                    <Pill color={T.yellow} bg="rgba(245,158,11,0.1)">
                      📅 {info.date_evenement}
                    </Pill>
                  )}
                </div>
                <button onClick={() => remove(info.id)} style={{
                  background: "none", border: "none", color: T.muted,
                  cursor: "pointer", fontSize: 16,
                }}>🗑️</button>
              </div>

              {/* Contenu */}
      <SectionHdr
        title="Infos & Actualités"
        sub={`${infos.length} publication(s)`}
        action={<button style={btn()} onClick={() => setModal(true)}>📣 Publier une info</button>}
      />

      {loading ? <Spinner /> : infos.length === 0 ? (
        <Empty icon="📭" msg="Aucune information publiée" action={
          <button style={btn()} onClick={() => setModal(true)}>Publier la première</button>
        } />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 14 }}>
          {infos.map(info => (
            <div key={info.id} style={{ ...C.card, display: "flex", flexDirection: "column" }}>
              {info.image_url && (
                <img src={`${BASE}${info.image_url}`} alt={info.titre}
                  style={{ width: "100%", height: 168, objectFit: "cover",
                    borderRadius: 10, marginBottom: 12 }}
                  onError={e => { e.target.style.display = "none"; }} />
              )}
              {info.video_url && (
                <video controls style={{ width: "100%", borderRadius: 10, marginBottom: 12, maxHeight: 200 }}>
                  <source src={`${BASE}${info.video_url}`} type={info.video_mimetype || "video/mp4"} />
                </video>
              )}
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11,
                    fontWeight: 600, background: "rgba(59,130,246,0.1)", color: T.blue }}>
                    {info.cible === "tous" ? "🌍 Tous" : `🎯 ${info.cible}`}
                  </span>
                  {info.date_evenement && (
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11,
                      fontWeight: 600, background: "rgba(245,158,11,0.1)", color: T.yellow }}>
                      📅 {info.date_evenement}
                    </span>
                  )}
                </div>
                <button onClick={() => supprimer(info.id)} style={{ background: "none",
                  border: "none", color: T.muted, cursor: "pointer", fontSize: 16 }}>🗑️</button>
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
                {info.titre}
              </h3>
              {info.description && (
                <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.6, margin: "0 0 10px" }}>
                <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.6, margin: "0 0 8px", flex: 1 }}>
                  {info.description}
                </p>
              )}
              {info.lien && (
                <a href={info.lien} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: T.blue, display: "block", marginBottom: 8 }}>
                  🔗 {info.lien}
                </a>
              )}

              {/* Réactions */}
              {info.total_reactions > 0 && (
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(info.reactions || {}).filter(([, v]) => v > 0).map(([e, c]) => (
                    <span key={e} style={{
                      background: "rgba(255,255,255,0.06)", borderRadius: 10,
                      padding: "2px 8px", fontSize: 12,
                    }}>{e} {c}</span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between",
                fontSize: 11, color: T.muted }}>
                <span>{info.auteur || "Admin"}</span>
                <span>{new Date(info.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
            </Card>
              {info.total_reactions > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {Object.entries(info.reactions || {}).filter(([, v]) => v > 0).map(([em, cnt]) => (
                    <span key={em} style={{ padding: "2px 8px", borderRadius: 10, fontSize: 12,
                      background: "rgba(255,255,255,0.06)" }}>{em} {cnt}</span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: "auto", paddingTop: 10,
                borderTop: `1px solid ${T.border}`,
                display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted }}>
                <span>{info.auteur}</span>
                <span>{new Date(info.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Publier une information">
        <Input label="Titre *" value={form.titre}
          onChange={v => setForm(p => ({ ...p, titre: v }))}
          placeholder="Ex: Réunion pédagogique vendredi 16h" required />
        <Input label="Description" value={form.description}
          onChange={v => setForm(p => ({ ...p, description: v }))}
          placeholder="Détails de l'information…" rows={4} />
        <Input label="Lien externe (optionnel)" value={form.lien}
          onChange={v => setForm(p => ({ ...p, lien: v }))}
          placeholder="https://…" />
        <Input label="Date de l'événement" type="date" value={form.date_evenement}
          onChange={v => setForm(p => ({ ...p, date_evenement: v }))} />
        <Input label="Audience" value={form.cible}
          onChange={v => setForm(p => ({ ...p, cible: v }))} options={CIBLES} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
          <Btn onClick={publish} disabled={!form.titre}>Publier</Btn>
      {/* Modal publication */}
      <Modal open={modal} onClose={() => { setModal(false); reinit(); }}
        title="📣 Publier une information" width={600}>
        <Inp label="Titre *" value={form.titre}
          onChange={v => setForm(p => ({ ...p, titre: v }))}
          placeholder="Ex: Réunion pédagogique — vendredi 16h" required />
        <Inp label="Description" value={form.description}
          onChange={v => setForm(p => ({ ...p, description: v }))}
          placeholder="Détails de l'annonce…" rows={3} />

        {/* Image */}
        <Field label="📷 IMAGE (optionnel · max 10 Mo)">
          <input ref={imgRef} type="file" accept="image/*" onChange={handleImg}
            style={{ ...C.inp, padding: "7px 10px" }} />
          {imagePreview && (
            <div style={{ marginTop: 8, position: "relative" }}>
              <img src={imagePreview} alt="preview" style={{ width: "100%", maxHeight: 130,
                objectFit: "cover", borderRadius: 8 }} />
              <button onClick={() => { setImageFile(null); setImagePreview(null); if (imgRef.current) imgRef.current.value = ""; }}
                style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.65)",
                  border: "none", color: "#fff", borderRadius: 6, padding: "3px 8px",
                  cursor: "pointer", fontSize: 11 }}>✕ Retirer</button>
            </div>
          )}
        </Field>

        {/* Vidéo */}
        <Field label="🎥 VIDÉO (optionnel · max 50 Mo)">
          <input ref={vidRef} type="file" accept="video/*" onChange={handleVid}
            style={{ ...C.inp, padding: "7px 10px" }} />
          {videoFile && (
            <div style={{ marginTop: 6, fontSize: 11, color: T.green }}>
              ✅ {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} Mo)
              <button onClick={() => { setVideoFile(null); if (vidRef.current) vidRef.current.value = ""; }}
                style={{ marginLeft: 8, background: "none", border: "none",
                  color: T.muted, cursor: "pointer", fontSize: 11 }}>✕ Retirer</button>
            </div>
          )}
        </Field>

        <G2>
          <Inp label="Lien externe" value={form.lien}
            onChange={v => setForm(p => ({ ...p, lien: v }))} placeholder="https://…" />
          <DatePicker label="📅 DATE DE L'ÉVÉNEMENT" value={form.date_evenement}
            onChange={v => setForm(p => ({ ...p, date_evenement: v }))} />
        </G2>
        <Inp label="Audience cible" value={form.cible}
          onChange={v => setForm(p => ({ ...p, cible: v }))} options={CIBLES} mb={20} />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={btn("ghost")} onClick={() => { setModal(false); reinit(); }}>Annuler</button>
          <button style={{ ...btn(), opacity: saving ? 0.6 : 1 }}
            onClick={publier} disabled={saving || !form.titre}>
            {saving ? "Publication…" : "📣 Publier"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  PAGE UTILISATEURS                                                           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
        
const ROLE_COLOR = { etudiant: T.cyan, admin: T.yellow, admin_general: T.accent };
const ROLE_OPTS  = [
  { value: "etudiant",     label: "Étudiant" },
  { value: "admin",        label: "Administrateur" },
  { value: "admin_general",label: "Admin Général" },
];
// Création :
//   • Étudiant → POST /register (form-urlencoded, champ = "username")
//   • Admin / Admin général → POST /admin/creer (JSON)
// Rôle : le backend n'a pas de PATCH /users/{id}/role → on utilise /admin/creer
//   pour créer un admin, et on informe l'admin que le changement de rôle nécessite
//   une suppression + recréation via /admin/creer
const ROLE_META = {
  etudiant:      { color: T.cyan,   bg: "rgba(6,182,212,0.1)",  label: "Étudiant"       },
  admin:         { color: T.yellow, bg: "rgba(245,158,11,0.1)", label: "Administrateur" },
  admin_general: { color: T.accent, bg: "rgba(200,16,46,0.12)", label: "Admin Général"  },
};
const BADGE_ICONS = {
  etudiant_actif:       "🎯",
  super_contributeur:   "⭐",
  protecteur_du_campus: "🛡️",
};

export function PageUtilisateurs({ token, showToast }) {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [roleF,    setRoleF]    = useState("");
  const [search,   setSearch]   = useState("");
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({
    matricule: "", nom: "", prenom: "",
    mot_de_passe: "", filiere: "", niveau: "", role: "etudiant",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers(await getUsers(token, roleF || null)); }
    catch (e) { showToast?.("❌ " + e.message, "error"); }
    finally { setLoading(false); }
  }, [token, roleF]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
   /*try {
      await createUser(token, form);
      showToast?.("✅ Compte créé", "success");
      setModal(false);
      setForm({ matricule: "", nom: "", prenom: "", mot_de_passe: "", filiere: "", niveau: "", role: "etudiant" });
      load();
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
  }; */
    try {
      // On envoie UNIQUEMENT les champs que Pydantic UserRegister accepte
      const payload = {
        matricule:    form.matricule.toUpperCase(),
        mot_de_passe: form.mot_de_passe,
        nom:          form.nom,
        prenom:       form.prenom,
        filiere:      form.filiere || undefined,
        niveau:       form.niveau  || undefined,
      };
      await createUser(token, payload);
      // Ensuite on met à jour le rôle séparément si besoin
      showToast?.("✅ Compte créé", "success");
      setModal(false);
      setForm({ matricule: "", nom: "", prenom: "", mot_de_passe: "",
                filiere: "", niveau: "", role: "etudiant" });
      load();
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
  };
  
  const changeRole = async (u, role) => {
    try {
      await updateRole(token, u.id, role);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role } : x));
      showToast?.("✅ Rôle mis à jour", "success");
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
  };

  const suspend = async (u) => {
    try {
      const d = await toggleSuspend(token, u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, suspendu: d.suspendu } : x));
      showToast?.(d.message, "success");
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
  };

  const remove = async (u) => {
    if (!confirm(`Supprimer ${u.prenom} ${u.nom} définitivement ?`)) return;
    try {
      await deleteUser(token, u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      showToast?.("🗑️ Compte supprimé", "success");
    } catch (e) {
      showToast?.("❌ " + e.message, "error");
    }
  };

  const filtered = users.filter(u =>
    `${u.prenom} ${u.nom} ${u.matricule} ${u.classe || ""}`.toLowerCase()
      .includes(search.toLowerCase())
  );

  // Stats rapides
  const statsRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  const suspendus = users.filter(u => u.suspendu).length;

  return (
    <div>
      <SectionTitle action={<Btn onClick={() => setModal(true)}>+ Créer un compte</Btn>}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>Utilisateurs</h2>
        <span style={{ fontSize: 13, color: T.sub }}>{filtered.length} résultat(s)</span>
      </SectionTitle>

  const [selected, setSelected] = useState(null);
  const [notesEtu, setNotesEtu] = useState(null);

  // Filtres
  const [roleF,    setRoleF]    = useState("");
  const [filiereF, setFiliereF] = useState("");
  const [niveauF,  setNiveauF]  = useState("");
  const [search,   setSearch]   = useState("");

  // Modal création
  const [modal,    setModal]    = useState(false);
  const [roleType, setRoleType] = useState("etudiant"); // pour switcher le formulaire
  const [form,     setForm]     = useState({
    matricule: "", nom: "", prenom: "", mot_de_passe: "",
    filiere: "", niveau: "", role: "etudiant",
  });
  const [saving, setSaving] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (roleF) q.set("role", roleF);
      const data = await apiFetch(`/users${q.toString() ? "?" + q : ""}`, {}, token);
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, [token, roleF]);

  useEffect(() => { charger(); }, [charger]);

  const voirNotes = async (u) => {
    setNotesEtu(null);
    if (u.role !== "etudiant") return;
    try {
      const d = await apiFetch(`/notes/etudiant/${u.id}`, {}, token);
      setNotesEtu(d);
    } catch { setNotesEtu({ notes: [], moyenne_generale: null }); }
  };

  const selectionner = (u) => {
    if (selected?.id === u.id) { setSelected(null); setNotesEtu(null); return; }
    setSelected(u); voirNotes(u);
  };

  const creer = async () => {
    if (!form.matricule || !form.nom || !form.prenom || !form.mot_de_passe) {
      return showToast?.("Tous les champs obligatoires (*) doivent être remplis", "warning");
    }
    setSaving(true);
    try {
      if (form.role === "etudiant") {
        // ✅ /register attend application/x-www-form-urlencoded avec champ "username"
        const fd = new URLSearchParams();
        fd.append("username",  form.matricule.trim().toUpperCase());
        fd.append("password",  form.mot_de_passe);
        fd.append("prenom",    form.prenom.trim());
        fd.append("nom",       form.nom.trim());
        if (form.filiere) fd.append("filiere", form.filiere.toUpperCase());
        if (form.niveau)  fd.append("niveau",  form.niveau.toUpperCase());

        const r = await fetch(`${BASE}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: fd,
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || "Erreur création");
        showToast?.(`✅ Étudiant créé · Classe : ${d.classe || "—"}`, "success");
      } else {
        // ✅ /admin/creer attend JSON avec champs: matricule, mot_de_passe, nom, prenom, role
        const d = await apiFetch("/admin/creer", {
          method: "POST",
          body: JSON.stringify({
            matricule:    form.matricule.trim().toUpperCase(),
            mot_de_passe: form.mot_de_passe,
            prenom:       form.prenom.trim(),
            nom:          form.nom.trim(),
            role:         form.role,
          }),
        }, token);
        showToast?.(`✅ ${d.role === "admin_general" ? "Admin Général" : "Admin"} créé`, "success");
      }
      setModal(false);
      setForm({ matricule: "", nom: "", prenom: "", mot_de_passe: "", filiere: "", niveau: "", role: "etudiant" });
      charger();
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const suspendre = async (u) => {
    try {
      const d = await apiFetch(`/users/${u.id}/suspendre`, { method: "PATCH" }, token);
      setUsers(p => p.map(x => x.id === u.id ? { ...x, suspendu: d.suspendu } : x));
      if (selected?.id === u.id) setSelected(p => ({ ...p, suspendu: d.suspendu }));
      showToast?.(d.message, "success");
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
  };

  const supprimer = async (u) => {
    if (!confirm(`Supprimer définitivement ${u.prenom} ${u.nom} ?`)) return;
    try {
      await apiFetch(`/users/${u.id}`, { method: "DELETE" }, token);
      setUsers(p => p.filter(x => x.id !== u.id));
      if (selected?.id === u.id) { setSelected(null); setNotesEtu(null); }
      showToast?.("🗑️ Compte supprimé", "success");
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
  };

  // Filtrage local multi-critères
  const usersFiltres = users.filter(u => {
    if (filiereF && u.filiere !== filiereF) return false;
    if (niveauF  && u.niveau  !== niveauF)  return false;
    if (search && !`${u.prenom} ${u.nom} ${u.matricule} ${u.classe || ""}`.toLowerCase()
      .includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    if (u.suspendu) acc._sus = (acc._sus || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <SectionHdr
        title="Utilisateurs"
        sub={`${usersFiltres.length} affiché(s) sur ${users.length} total`}
        action={<button style={btn()} onClick={() => setModal(true)}>+ Créer un compte</button>}
      />


      {/* Stats rapides */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Étudiants",      val: statsRole.etudiant || 0,     color: T.cyan   },
          { label: "Admins",         val: statsRole.admin || 0,        color: T.yellow },
          { label: "Admins généraux",val: statsRole.admin_general || 0,color: T.accent },
          { label: "Suspendus",      val: suspendus,                    color: T.red    },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ padding: "8px 16px", borderRadius: 10,
            background: T.card, border: `1px solid ${T.border}`,
            fontSize: 12, color: T.sub }}>
            <span style={{ fontWeight: 700, color, fontSize: 16 }}>{val}</span>
            {" "}{label}
          { k: "etudiant",     l: "Étudiants",      c: T.cyan   },
          { k: "admin",        l: "Admins",          c: T.yellow },
          { k: "admin_general",l: "Admins généraux", c: T.accent },
          { k: "_sus",         l: "Suspendus",       c: T.red    },
        ].map(({ k, l, c }) => (
          <div key={k} style={{ padding: "10px 18px", borderRadius: 12,
            background: T.card, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: c }}>{stats[k] || 0}</span>
            <span style={{ fontSize: 12, color: T.sub }}>{l}</span>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher par nom, matricule, classe…"
          style={{ flex: 1, minWidth: 220, padding: "8px 13px", borderRadius: 9,
            border: `1px solid ${T.border}`, background: T.card, color: T.text,
            fontSize: 12, outline: "none", fontFamily: "inherit" }} />
        <select value={roleF} onChange={e => setRoleF(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 9, border: `1px solid ${T.border}`,
            background: T.card, color: T.text, fontSize: 12, fontFamily: "inherit" }}>
          <option value="">Tous les rôles</option>
          {ROLE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? <Spinner /> : (
        <Card padding={0}>
          {/* En-tête */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 100px 120px 60px 100px 90px",
            padding: "10px 18px", borderBottom: `1px solid ${T.border}`,
            fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.07em",
          }}>
            <span>UTILISATEUR</span><span>CLASSE</span>
            <span>RÔLE</span><span>XP</span>
            <span>STATUT</span><span>ACTIONS</span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="👤" message="Aucun utilisateur trouvé" />
          ) : filtered.map(u => (
            <div key={u.id} style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 120px 60px 100px 90px",
              padding: "11px 18px", borderBottom: `1px solid ${T.border}`,
              alignItems: "center", gap: 8,
            }}>
              {/* Nom */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                  {u.prenom} {u.nom}
                </div>
                <div style={{ fontSize: 11, color: T.sub }}>{u.matricule}</div>
              </div>

              {/* Classe */}
              <div style={{ fontSize: 11, color: T.sub }}>{u.classe || "—"}</div>

              {/* Rôle */}
              <select value={u.role} onChange={e => changeRole(u, e.target.value)}
                style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`,
                  background: "transparent", color: ROLE_COLOR[u.role] || T.sub,
                  fontSize: 11, fontFamily: "inherit" }}>
                {ROLE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* XP */}
              <div style={{ fontSize: 12, color: T.yellow, fontWeight: 700 }}>
                {u.xp || 0}
              </div>

              {/* Statut */}
              <div>
                {u.suspendu ? (
                  <Pill color="#F87171" bg="rgba(239,68,68,0.1)" dot="#EF4444">Suspendu</Pill>
                ) : (
                  <Pill color={T.green} bg="rgba(16,185,129,0.1)" dot={T.green}>Actif</Pill>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => suspend(u)} title={u.suspendu ? "Réactiver" : "Suspendre"}
                  style={{ background: "none", border: `1px solid ${T.border}`, color: T.sub,
                    borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>
                  {u.suspendu ? "▶" : "⏸"}
                </button>
                <button onClick={() => remove(u)} title="Supprimer"
                  style={{ background: "none", border: "1px solid rgba(239,68,68,0.2)",
                    color: "#F87171", borderRadius: 6, padding: "4px 8px",
                    cursor: "pointer", fontSize: 12 }}>🗑️</button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Modal création */}
      <Modal open={modal} onClose={() => setModal(false)} title="Créer un compte" width={500}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Prénom *" value={form.prenom}
            onChange={v => setForm(p => ({ ...p, prenom: v }))} required />
          <Input label="Nom *" value={form.nom}
            onChange={v => setForm(p => ({ ...p, nom: v }))} required />
        </div>
        <Input label="Matricule * (ex: AFI-042)" value={form.matricule}
          onChange={v => setForm(p => ({ ...p, matricule: v }))} required />
        <Input label="Mot de passe *" type="password" value={form.mot_de_passe}
          onChange={v => setForm(p => ({ ...p, mot_de_passe: v }))} required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Filière" value={form.filiere}
            onChange={v => setForm(p => ({ ...p, filiere: v }))}
            options={FILIERES.map(f => ({ value: f.code, label: `${f.code} — ${f.label}` }))} />
          <Input label="Niveau" value={form.niveau}
            onChange={v => setForm(p => ({ ...p, niveau: v }))}
            options={NIVEAUX.map(n => ({ value: n.code, label: `${n.code} — ${n.label}` }))} />
        </div>
        <Input label="Rôle" value={form.role}
          onChange={v => setForm(p => ({ ...p, role: v }))} options={ROLE_OPTS} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>Annuler</Btn>
          <Btn onClick={create}
            disabled={!form.matricule || !form.nom || !form.prenom || !form.mot_de_passe}>
            Créer le compte
          </Btn>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.5fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "FILIÈRE", key: "filiereF", set: setFiliereF, val: filiereF,
            opts: [{ v:"", l:"Toutes filières"}, ...FILIERES.map(f=>({v:f.code, l:`${f.code} — ${f.label}`}))] },
          { label: "NIVEAU", key: "niveauF", set: setNiveauF, val: niveauF,
            opts: [{ v:"", l:"Tous niveaux"}, ...NIVEAUX.map(n=>({v:n.code, l:`${n.code} — ${n.label}`}))] },
          { label: "RÔLE", key: "roleF", set: setRoleF, val: roleF,
            opts: [{ v:"",l:"Tous rôles"},{ v:"etudiant",l:"Étudiant"},{ v:"admin",l:"Admin"},{ v:"admin_general",l:"Admin Général"}] },
        ].map(({ label, set, val, opts }) => (
          <div key={label}>
            <label style={C.label}>{label}</label>
            <select value={val} onChange={e => { set(e.target.value); setSelected(null); }}
              style={C.inp}>
              {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label style={C.label}>RECHERCHE</label>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Nom, prénom, matricule, classe…" style={C.inp} />
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr",
          gap: 14, alignItems: "start" }}>

          {/* Table */}
          <div style={{ ...C.card, padding: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 120px 56px 90px 80px",
              padding: "10px 18px", borderBottom: `1px solid ${T.border}`,
              fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.07em" }}>
              <span>UTILISATEUR</span><span>CLASSE</span><span>RÔLE</span>
              <span>XP</span><span>STATUT</span><span>ACTIONS</span>
            </div>

            {usersFiltres.length === 0 ? (
              <Empty icon="👤" msg="Aucun utilisateur trouvé" />
            ) : usersFiltres.map(u => {
              const rm = ROLE_META[u.role] || { color: T.sub, bg: "transparent", label: u.role };
              const isSel = selected?.id === u.id;
              return (
                <div key={u.id} onClick={() => selectionner(u)} style={{
                  display: "grid", gridTemplateColumns: "1fr 90px 120px 56px 90px 80px",
                  padding: "11px 18px", borderBottom: `1px solid ${T.border}`,
                  alignItems: "center", gap: 8, cursor: "pointer",
                  background: isSel ? "rgba(59,130,246,0.05)" : "transparent",
                  borderLeft: `3px solid ${isSel ? T.blue : "transparent"}`,
                  transition: "all 0.12s",
                }}>
                  {/* Nom + avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: u.photo_url ? "transparent"
                        : "linear-gradient(135deg,#3B82F6,#8B5CF6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden",
                    }}>
                      {u.photo_url
                        ? <img src={u.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : `${u.prenom?.[0] || ""}${u.nom?.[0] || ""}`}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                        {u.prenom} {u.nom}
                      </div>
                      <div style={{ fontSize: 10, color: T.sub }}>{u.matricule}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: T.sub }}>{u.classe || "—"}</div>

                  <span style={{ padding: "4px 8px", borderRadius: 8, fontSize: 10,
                    fontWeight: 700, background: rm.bg, color: rm.color }}>
                    {rm.label}
                  </span>

                  <div style={{ fontSize: 12, fontWeight: 700, color: T.yellow }}>
                    {u.xp || 0}
                  </div>

                  <div>
                    {u.suspendu
                      ? <span style={{ fontSize: 10, color: "#F87171",
                          background: "rgba(239,68,68,0.1)", padding: "3px 8px",
                          borderRadius: 10, fontWeight: 600 }}>⛔ Suspendu</span>
                      : <span style={{ fontSize: 10, color: T.green,
                          background: "rgba(16,185,129,0.1)", padding: "3px 8px",
                          borderRadius: 10, fontWeight: 600 }}>✅ Actif</span>}
                  </div>

                  <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => suspendre(u)}
                      title={u.suspendu ? "Réactiver" : "Suspendre"}
                      style={{ background: "none", border: `1px solid ${T.border}`, color: T.sub,
                        borderRadius: 6, padding: "4px 7px", cursor: "pointer", fontSize: 12 }}>
                      {u.suspendu ? "▶" : "⏸"}
                    </button>
                    <button onClick={() => supprimer(u)} title="Supprimer"
                      style={{ background: "none", border: "1px solid rgba(239,68,68,0.2)",
                        color: "#F87171", borderRadius: 6, padding: "4px 7px",
                        cursor: "pointer", fontSize: 12 }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fiche détaillée */}
          {selected && (
            <div style={{ ...C.card, position: "sticky", top: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 18 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.sub, letterSpacing: "0.07em" }}>
                  FICHE UTILISATEUR
                </span>
                <button onClick={() => { setSelected(null); setNotesEtu(null); }}
                  style={{ background: "none", border: "none", color: T.sub,
                    cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>

              {/* Avatar */}
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 18, margin: "0 auto 12px",
                  background: selected.photo_url ? "transparent"
                    : "linear-gradient(135deg,#3B82F6,#8B5CF6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900, color: "#fff", overflow: "hidden",
                }}>
                  {selected.photo_url
                    ? <img src={selected.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : `${selected.prenom?.[0] || ""}${selected.nom?.[0] || ""}`}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: "0 0 4px" }}>
                  {selected.prenom} {selected.nom}
                </h3>
                <div style={{ fontSize: 12, color: T.sub }}>{selected.matricule}</div>
                {selected.badges?.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center",
                    gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {selected.badges.map(b => (
                      <span key={b} title={b} style={{ fontSize: 20 }}>
                        {BADGE_ICONS[b] || "🏅"}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Infos grille */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[
                  { l:"Rôle",      v: ROLE_META[selected.role]?.label || selected.role },
                  { l:"Statut",    v: selected.suspendu ? "⛔ Suspendu" : "✅ Actif" },
                  { l:"Filière",   v: selected.filiere_label || selected.filiere || "—" },
                  { l:"Niveau",    v: selected.niveau_label  || selected.niveau  || "—" },
                  { l:"Classe",    v: selected.classe || "—" },
                  { l:"XP",        v: `${selected.xp || 0} pts` },
                  { l:"Email",     v: selected.email || "—" },
                  { l:"Inscrit le",v: selected.created_at
                      ? new Date(selected.created_at).toLocaleDateString("fr-FR") : "—" },
                ].map(({ l, v }) => (
                  <div key={l} style={{ padding: "8px 10px", borderRadius: 8,
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 9, color: T.muted, fontWeight: 700,
                      letterSpacing: "0.06em", marginBottom: 3 }}>{l.toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Notes si étudiant */}
              {selected.role === "etudiant" && (
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.sub,
                    letterSpacing: "0.07em", marginBottom: 10 }}>📝 NOTES</div>
                  {notesEtu === null ? (
                    <div style={{ fontSize: 11, color: T.muted }}>Chargement…</div>
                  ) : notesEtu.notes?.length === 0 ? (
                    <div style={{ fontSize: 11, color: T.muted }}>Aucune note</div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, marginBottom: 8,
                        color: notesEtu.moyenne_generale >= 10 ? T.green : T.red }}>
                        {notesEtu.moyenne_generale?.toFixed(2) || "—"}
                        <span style={{ fontSize: 14, color: T.sub }}>/20</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {notesEtu.notes.slice(0, 5).map(n => (
                          <span key={n.id} style={{ fontSize: 10, padding: "3px 8px",
                            borderRadius: 8, fontWeight: 600,
                            background: n.note >= 10 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                            color: n.note >= 10 ? T.green : T.red }}>
                            {n.matiere} : {n.note}/20
                          </span>
                        ))}
                        {notesEtu.notes.length > 5 && (
                          <span style={{ fontSize: 10, color: T.muted }}>
                            +{notesEtu.notes.length - 5} autres
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => suspendre(selected)}
                  style={btn(selected.suspendu ? "success" : "secondary")}>
                  {selected.suspendu ? "▶ Réactiver le compte" : "⏸ Suspendre le compte"}
                </button>
                <button onClick={() => supprimer(selected)} style={btn("danger")}>
                  🗑️ Supprimer définitivement
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal créer compte */}
      <Modal open={modal} onClose={() => setModal(false)} title="Créer un compte" width={540}>
        {/* Switch étudiant / admin */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, padding: "4px",
          background: T.sidebar, borderRadius: 10 }}>
          {[
            { v: "etudiant",      l: "👨‍🎓 Étudiant" },
            { v: "admin",         l: "🔑 Administrateur" },
            { v: "admin_general", l: "👑 Admin Général" },
          ].map(({ v, l }) => (
            <button key={v}
              onClick={() => { setForm(p => ({ ...p, role: v })); setRoleType(v); }}
              style={{
                flex: 1, padding: "8px 4px", borderRadius: 8, border: "none",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                background: form.role === v ? T.accent : "transparent",
                color: form.role === v ? "#fff" : T.sub,
                transition: "all 0.15s",
              }}>{l}</button>
          ))}
        </div>

        <G2>
          <Inp label="Prénom *" value={form.prenom}
            onChange={v => setForm(p => ({ ...p, prenom: v }))} required />
          <Inp label="Nom *" value={form.nom}
            onChange={v => setForm(p => ({ ...p, nom: v }))} required />
        </G2>

        <Inp label="Matricule * (ex: AFI-042)" value={form.matricule}
          onChange={v => setForm(p => ({ ...p, matricule: v }))} required />

        <Inp label="Mot de passe *" type="password" value={form.mot_de_passe}
          onChange={v => setForm(p => ({ ...p, mot_de_passe: v }))} required />

        {/* Filière + Niveau uniquement pour étudiant */}
        {form.role === "etudiant" && (
          <G2>
            <Inp label="Filière" value={form.filiere}
              onChange={v => setForm(p => ({ ...p, filiere: v }))}
              options={FILIERES.map(f => ({ v: f.code, l: `${f.code} — ${f.label}` }))} />
            <Inp label="Niveau" value={form.niveau}
              onChange={v => setForm(p => ({ ...p, niveau: v }))}
              options={NIVEAUX.map(n => ({ v: n.code, l: `${n.code} — ${n.label}` }))} />
          </G2>
        )}

        {form.role !== "etudiant" && (
          <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14,
            background: "rgba(245,158,11,0.08)", border: `1px solid rgba(245,158,11,0.2)`,
            fontSize: 12, color: T.yellow }}>
            ℹ️ Les comptes administrateurs sont créés sans filière/niveau.
            Endpoint utilisé : <code style={{ fontSize: 11 }}>POST /admin/creer</code>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button style={btn("ghost")} onClick={() => setModal(false)}>Annuler</button>
          <button style={{ ...btn(), opacity: saving ? 0.6 : 1 }}
            onClick={creer}
            disabled={saving || !form.matricule || !form.nom || !form.prenom || !form.mot_de_passe}>
            {saving ? "Création…" : "✅ Créer le compte"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

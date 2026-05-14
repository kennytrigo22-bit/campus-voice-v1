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
  getNotesEtudiant, createNote, getNotesFilieres, getEtudiantsNotes,
  getClasses, getPlanningClasse, updateSeance, createSeance, getSalles,
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
  const [search,    setSearch]    = useState("");

  // Données pour le sélecteur filière → classe → étudiant
  const [filieres,       setFilieres]       = useState([]);
  const [filiereChoisie, setFiliereChoisie] = useState("");
  const [classeChoisie,  setClasseChoisie]  = useState("");
  const [etudiantsCls,   setEtudiantsCls]   = useState([]);

  // Formulaire ajout note
  const [form, setForm] = useState({ user_id: "", matiere: "", note: "", semestre: "S1" });

  useEffect(() => {
    getUsers(token, "etudiant")
      .then(setEtudiants)
      .catch(e => showToast?.("❌ " + e.message, "error"));
    getNotesFilieres(token)
      .then(setFilieres)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    setClasseChoisie(""); setEtudiantsCls([]); setForm(p => ({ ...p, user_id: "" }));
    if (!filiereChoisie) return;
    getEtudiantsNotes(token, { filiere: filiereChoisie }).then(setEtudiantsCls).catch(() => {});
  }, [filiereChoisie, token]);

  useEffect(() => {
    setForm(p => ({ ...p, user_id: "" }));
    if (!classeChoisie || !filiereChoisie) return;
    getEtudiantsNotes(token, { filiere: filiereChoisie, classe: classeChoisie })
      .then(setEtudiantsCls).catch(() => {});
  }, [classeChoisie, filiereChoisie, token]);

  const loadNotes = async (u) => {
    setSelected(u); setLoading(true);
    try {
      const d = await getNotesEtudiant(token, u.id);
      setNotes(d.notes || []);
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
    finally { setLoading(false); }
  };

  const openModal = () => {
    if (selected) {
      setFiliereChoisie(selected.filiere || "");
      setClasseChoisie(selected.classe || "");
      setForm(p => ({ ...p, user_id: selected.id }));
    }
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setForm({ user_id: "", matiere: "", note: "", semestre: "S1" });
    setFiliereChoisie(""); setClasseChoisie(""); setEtudiantsCls([]);
  };

  const addNote = async () => {
    if (!form.user_id) { showToast?.("⚠️ Sélectionnez un étudiant", "error"); return; }
    if (!form.matiere)  { showToast?.("⚠️ La matière est obligatoire", "error"); return; }
    if (form.note === "") { showToast?.("⚠️ La note est obligatoire", "error"); return; }
    try {
      await createNote(token, {
        user_id: parseInt(form.user_id),
        matiere: form.matiere,
        note: parseFloat(form.note),
        semestre: form.semestre,
      });
      showToast?.("✅ Note ajoutée", "success");
      closeModal();
      if (selected && selected.id === parseInt(form.user_id)) loadNotes(selected);
    } catch (e) { showToast?.("❌ " + e.message, "error"); }
  };

  const classesDisponibles = filieres.find(f => f.code === filiereChoisie)?.classes || [];
  const filtered = etudiants.filter(u =>
    `${u.prenom} ${u.nom} ${u.matricule} ${u.classe || ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const moyenne   = notes.length ? (notes.reduce((a, n) => a + n.note, 0) / notes.length).toFixed(2) : null;
  const parSem    = notes.reduce((acc, n) => { acc[n.semestre] = acc[n.semestre] || []; acc[n.semestre].push(n.note); return acc; }, {});
  const moyParSem = Object.entries(parSem).map(([s, vals]) => ({ sem: s, moy: (vals.reduce((a, v) => a + v, 0) / vals.length).toFixed(2) }));

  const selectStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 7,
    border: `1px solid ${T.border}`, background: T.sidebar, color: T.text,
    fontSize: 12, fontFamily: "inherit", outline: "none",
  };

  return (
    <div>
      <SectionTitle action={<Btn onClick={openModal}>+ Ajouter une note</Btn>}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>Notes</h2>
        <span style={{ fontSize: 13, color: T.sub }}>{etudiants.length} étudiant(s)</span>
      </SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher…"
            style={{ width: "100%", padding: "9px 13px", borderRadius: 9,
              border: `1px solid ${T.border}`, background: T.card, color: T.text,
              fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          <Card padding={0} style={{ maxHeight: 560, overflowY: "auto" }}>
            <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`,
              fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.07em" }}>
              ÉTUDIANTS ({filtered.length})
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: T.muted, fontSize: 12 }}>Aucun résultat</div>
            ) : filtered.map(u => (
              <div key={u.id} onClick={() => loadNotes(u)} style={{
                padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${T.border}`,
                background: selected?.id === u.id ? T.cardHover : "transparent", transition: "background 0.12s",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{u.prenom} {u.nom}</div>
                <div style={{ fontSize: 10, color: T.sub }}>{u.matricule} · {u.classe || "Classe ?"}</div>
              </div>
            ))}
          </Card>
        </div>

        <Card>
          {!selected ? (
            <EmptyState icon="👆" message="Sélectionnez un étudiant pour voir ses notes" />
          ) : loading ? <Spinner /> : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: "0 0 4px" }}>
                    {selected.prenom} {selected.nom}
                  </h3>
                  <div style={{ fontSize: 12, color: T.sub }}>
                    {selected.matricule} · {selected.classe || "—"} · {selected.filiere || "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: moyenne >= 10 ? T.green : T.red, lineHeight: 1 }}>
                    {moyenne || "—"}<span style={{ fontSize: 16, color: T.sub }}>/20</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub }}>Moyenne générale</div>
                  {moyParSem.map(({ sem, moy }) => (
                    <div key={sem} style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                      {sem} : <span style={{ color: moy >= 10 ? T.green : T.red }}>{moy}/20</span>
                    </div>
                  ))}
                </div>
              </div>
              {notes.length === 0 ? (
                <EmptyState icon="📝" message="Aucune note pour cet étudiant" action={
                  <Btn small onClick={openModal}>+ Saisir une note</Btn>
                } />
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
                    {notes.map(n => (
                      <div key={n.id} style={{
                        padding: "12px 14px", borderRadius: 12,
                        background: n.note >= 10 ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
                        border: `1px solid ${n.note >= 10 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}>
                        <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>{n.semestre}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>{n.matiere}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: n.note >= 10 ? T.green : T.red, lineHeight: 1 }}>
                          {n.note}<span style={{ fontSize: 13, color: T.sub }}>/20</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Btn small onClick={openModal}>+ Ajouter une note à {selected.prenom}</Btn>
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Modal : filière → classe → étudiant → note */}
      <Modal open={modal} onClose={closeModal} title="Ajouter une note" width={480}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, letterSpacing: "0.07em", marginBottom: 6 }}>
            ÉTAPE 1 — FILIÈRE
          </div>
          <select value={filiereChoisie} onChange={e => setFiliereChoisie(e.target.value)} style={selectStyle}>
            <option value="">— Sélectionner une filière —</option>
            {filieres.map(f => <option key={f.code} value={f.code}>{f.code} — {f.label}</option>)}
          </select>
        </div>

        {filiereChoisie && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, letterSpacing: "0.07em", marginBottom: 6 }}>
              ÉTAPE 2 — CLASSE
            </div>
            <select value={classeChoisie} onChange={e => setClasseChoisie(e.target.value)} style={selectStyle}>
              <option value="">— Toutes les classes —</option>
              {classesDisponibles.map(c => (
                <option key={c.classe} value={c.classe}>{c.classe} ({c.nb_etudiants} étudiants)</option>
              ))}
            </select>
          </div>
        )}

        {filiereChoisie && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, letterSpacing: "0.07em", marginBottom: 6 }}>
              ÉTAPE 3 — ÉTUDIANT *
            </div>
            <select value={form.user_id} onChange={e => setForm(p => ({ ...p, user_id: e.target.value }))}
              style={{ ...selectStyle, borderColor: !form.user_id ? T.orange : T.border }}>
              <option value="">— Sélectionner un étudiant —</option>
              {etudiantsCls.map(e => (
                <option key={e.id} value={e.id}>{e.prenom} {e.nom} — {e.matricule} ({e.classe || "—"})</option>
              ))}
            </select>
            {filiereChoisie && etudiantsCls.length === 0 && (
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Aucun étudiant dans cette sélection</div>
            )}
          </div>
        )}

        <Divider />

        <Input label="Matière *" value={form.matiere}
          onChange={v => setForm(p => ({ ...p, matiere: v }))}
          placeholder="Ex: Mathématiques Financières" required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
          <Input label="Note (0 – 20) *" type="number" value={form.note}
            onChange={v => setForm(p => ({ ...p, note: v }))} placeholder="Ex: 14.5" required />
          <Input label="Semestre" value={form.semestre}
            onChange={v => setForm(p => ({ ...p, semestre: v }))}
            options={SEMESTRES.map(s => ({ value: s, label: s }))} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
          <Btn variant="ghost" onClick={closeModal}>Annuler</Btn>
          <Btn onClick={addNote} disabled={!form.user_id || !form.matiere || form.note === ""}>
            Enregistrer la note
          </Btn>
        </div>
      </Modal>
    </div>
  );
}


// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  PAGE PLANNING                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
const STATUT_SEANCE_COLOR = {
  programme:  T.cyan,
  en_ligne:   T.blue,
  annule:     T.red,
  reporte:    T.orange,
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
      </Modal>
    </div>
  );
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  PAGE INFOS & NEWS                                                           ║
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
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
                {info.titre}
              </h3>
              {info.description && (
                <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.6, margin: "0 0 10px" }}>
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
        </div>
      </Modal>
    </div>
  );
}

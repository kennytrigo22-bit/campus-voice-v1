// ─── Campus Voice — Couche API v4.0 ──────────────────────────────────────────
// Connecté à l'API FastAPI réelle. Aucune donnée fictive.

const BASE = "https://campus-voice-8d0u.onrender.com";

// ─── Utilitaire fetch ─────────────────────────────────────────────────────────
async function req(url, opts = {}, token = null) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const r = await fetch(BASE + url, { ...opts, headers });

  if (!r.ok) {
    let msg = `Erreur ${r.status}`;
    try { const d = await r.json(); msg = d.detail || msg; } catch (_) {}
    throw new Error(msg);
  }
  return r.json();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

/** Connexion par matricule + mot de passe → { access_token } */
export async function login(matricule, password) {
  const fd = new URLSearchParams();
  fd.append("username", matricule.toUpperCase());
  fd.append("password", password);
  const r = await fetch(`${BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: fd,
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.detail || "Identifiants incorrects");
  }
  return r.json();
}

/** Profil de l'utilisateur connecté */
export const getMe = (token) => req("/me", {}, token);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

/** KPIs principaux (admin_general requis) */
export const getKpis        = (t) => req("/dashboard/kpis", {}, t);

/** Top 5 signalements par score IA */
export const getTop5        = (t) => req("/dashboard/top5", {}, t);

/** Alertes récentes (48h) */
export const getAlertes     = (t) => req("/dashboard/alertes", {}, t);

/** Statistiques par catégorie / statut / émotion */
export const getStatistiques = (t) => req("/dashboard/statistiques", {}, t);

// ─── SIGNALEMENTS ─────────────────────────────────────────────────────────────

/** Liste des signalements (filtres optionnels) */
export const getSignalements = (t, { categorie, statut } = {}) => {
  const q = new URLSearchParams();
  if (categorie) q.set("categorie", categorie);
  if (statut)    q.set("statut", statut);
  return req(`/signalements?${q}`, {}, t);
};

/** Détail d'un signalement */
export const getSignalement = (t, id) => req(`/signalements/${id}`, {}, t);

/** Mettre à jour le statut */
export const updateStatut = (t, id, statut) =>
  req(`/signalements/${id}/statut`, { method: "PATCH", body: JSON.stringify({ statut }) }, t);

/** Supprimer (admin_general) */
export const deleteSignalement = (t, id) =>
  req(`/signalements/${id}`, { method: "DELETE" }, t);

// ─── IA ───────────────────────────────────────────────────────────────────────

/** Urgences IA (niveau ≥ 3, non résolus) */
export const getUrgencesIA = (t) => req("/ia/urgences", {}, t);

/** Rapport IA global */
export const getRapportIA  = (t) => req("/ia/rapport", {}, t);

// ─── NOTES ────────────────────────────────────────────────────────────────────

/** Notes de l'utilisateur connecté */
export const getMesNotes   = (t) => req("/notes", {}, t);

/** Notes d'un étudiant (admin) */
export const getNotesEtudiant = (t, userId) => req(`/notes/etudiant/${userId}`, {}, t);

/** Ajouter une note (admin) */
export const createNote = (t, data) =>
  req("/notes", { method: "POST", body: JSON.stringify(data) }, t);

/** Analyse IA des notes */
export const analyserNotes = (t) => req("/notes/analyse", {}, t);

// ─── PLANNING ─────────────────────────────────────────────────────────────────

/** Liste des classes ayant un planning */
export const getClasses = (t) => req("/planning/classes", {}, t);

/** Planning d'une classe */
export const getPlanningClasse = (t, classe) =>
  req(`/planning?classe=${classe}`, {}, t);

/** Modifier une séance */
export const updateSeance = (t, id, data) =>
  req(`/planning/${id}`, { method: "PATCH", body: JSON.stringify(data) }, t);

/** Import Excel planning */
export async function uploadPlanning(t, file, { filiere, niveau, semestre }) {
  const fd = new FormData();
  fd.append("fichier", file);
  const q = new URLSearchParams({ filiere, niveau, semestre });
  const r = await fetch(`${BASE}/planning/upload?${q}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}` },
    body: fd,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.detail || "Erreur upload");
  return d;
}

// ─── SALLES ───────────────────────────────────────────────────────────────────

/** Liste des salles actives */
export const getSalles = (t) => req("/salles", {}, t);

/** Créer une salle */
export const createSalle = (t, data) =>
  req("/salles", { method: "POST", body: JSON.stringify(data) }, t);

/** Désactiver une salle */
export const deleteSalle = (t, id) =>
  req(`/salles/${id}`, { method: "DELETE" }, t);

// ─── INFOS ────────────────────────────────────────────────────────────────────

/** Flux d'infos */
export const getInfos = (t) => req("/infos", {}, t);

/** Publier une info */
export const createInfo = (t, data) =>
  req("/infos", { method: "POST", body: JSON.stringify(data) }, t);

/** Supprimer une info */
export const deleteInfo = (t, id) =>
  req(`/infos/${id}`, { method: "DELETE" }, t);

/** Réagir à une info */
export const reagirInfo = (t, id, emoji) =>
  req(`/infos/${id}/reaction`, { method: "POST", body: JSON.stringify({ emoji }) }, t);

// ─── UTILISATEURS ─────────────────────────────────────────────────────────────



// ─── UTILISATEURS ─────────────────────────────────────────────────────────────
 
/** Liste des utilisateurs (admin_general) 
export const getUsers = (t, role = null) => {
  const q = role ? `?role=${role}` : "";
  return req(`/users${q}`, {}, t);
};*/

/** Liste des utilisateurs (admin_general) */
export const getUsers = (t, role = null) => {
  const q = role ? `?role=${role}` : "";
  return req(`/users${q}`, {}, t);
};
 
/** Créer un compte */
export async function createUser(t, data) {
  // /register attend application/x-www-form-urlencoded
  // avec les champs : username, password, prenom, nom, email, filiere, niveau, classe
  const fd = new URLSearchParams();
  fd.append("username",  (data.matricule || "").toUpperCase());
  fd.append("password",  data.mot_de_passe || "");
  fd.append("prenom",    data.prenom || "");
  fd.append("nom",       data.nom || "");
  if (data.email)   fd.append("email",   data.email);
  if (data.filiere) fd.append("filiere", data.filiere);
  if (data.niveau)  fd.append("niveau",  data.niveau);
  if (data.classe)  fd.append("classe",  data.classe);
 
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  if (t) headers["Authorization"] = `Bearer ${t}`;
 
  const r = await fetch(`${BASE}/register`, {
    method: "POST",
    headers,
    body: fd,
  });
 
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    let msg = `Erreur ${r.status}`;
    if (typeof d.detail === "string") {
      msg = d.detail;
    } else if (Array.isArray(d.detail)) {
      msg = d.detail
        .map(e => {
          const champ = Array.isArray(e.loc) ? e.loc.filter(x => x !== "body").join(".") : "";
          return champ ? `${champ} : ${e.msg}` : e.msg;
        })
        .join(" | ");
    }
    throw new Error(msg);
  }
  return d;
}
 
/** Changer le rôle */
export const updateRole = (t, id, role) =>
  req(`/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }, t);
 
/** Suspendre / réactiver */
export const toggleSuspend = (t, id) =>
  req(`/users/${id}/suspendre`, { method: "PATCH" }, t);
 
/** Supprimer un compte */
export const deleteUser = (t, id) =>
  req(`/users/${id}`, { method: "DELETE" }, t);

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

/** Liste des notifications */
export const getNotifications = (t, nonLues = false) =>
  req(`/notifications?non_lues_seulement=${nonLues}&limite=100`, {}, t);

/** Marquer une notification comme lue */
export const marquerLue = (t, id) =>
  req(`/notifications/${id}/lue`, { method: "PATCH" }, t);

/** Marquer toutes les notifications comme lues */
export const toutMarquerLu = (t) =>
  req("/notifications/toutes-lues", { method: "PATCH" }, t);

// ─── EXPORT ───────────────────────────────────────────────────────────────────

/** URL du rapport PDF (ouvrir dans un onglet) */
export const getPdfUrl = (token) =>
  `${BASE}/export/pdf?token=${token}`;

export { BASE };

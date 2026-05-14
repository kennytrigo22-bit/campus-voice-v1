// ─── Campus Voice — Design System v4.0 ───────────────────────────────────────

export const T = {
  bg:           "#06090F",
  sidebar:      "#0A0F1E",
  card:         "#0D1525",
  cardHover:    "#111C30",
  border:       "rgba(99,179,237,0.10)",
  borderAccent: "rgba(200,16,46,0.28)",
  text:         "#EDF2FF",
  sub:          "#6B8CAE",
  muted:        "#2E4A6B",
  accent:       "#C8102E",
  accentHover:  "#E8304E",
  blue:         "#3B82F6",
  cyan:         "#06B6D4",
  green:        "#10B981",
  yellow:       "#F59E0B",
  orange:       "#F97316",
  purple:       "#8B5CF6",
  red:          "#EF4444",
  pink:         "#EC4899",
};

// Couleurs par catégorie de signalement (valeurs backend)
export const CAT_COLOR = {
  wifi:         "#3B82F6",
  electricite:  "#F59E0B",
  eau:          "#06B6D4",
  salle:        "#8B5CF6",
  admin:        "#EC4899",
  securite:     "#EF4444",
  cafeteria:    "#F97316",
  sanitaire:    "#10B981",
  bibliotheque: "#6366F1",
  autre:        "#9CA3AF",
};

// Icônes par catégorie
export const CAT_ICON = {
  wifi:         "📶",
  electricite:  "⚡",
  eau:          "💧",
  salle:        "🏫",
  admin:        "📋",
  securite:     "🔒",
  cafeteria:    "🍽️",
  sanitaire:    "🚿",
  bibliotheque: "📚",
  autre:        "📌",
};

// Statuts signalement (valeurs backend snake_case)
export const STATUT_META = {
  en_attente:     { label: "En attente",     bg: "rgba(200,16,46,0.12)",  text: "#F87171", dot: "#C8102E"  },
  en_cours:       { label: "En cours",       bg: "rgba(6,182,212,0.12)",  text: "#22D3EE", dot: "#06B6D4"  },
  pris_en_charge: { label: "Pris en charge", bg: "rgba(139,92,246,0.12)", text: "#A78BFA", dot: "#8B5CF6"  },
  resolu:         { label: "Résolu",         bg: "rgba(16,185,129,0.12)", text: "#34D399", dot: "#10B981"  },
};

// Couleur par niveau d'urgence 0-5
export const URGENCE_COLOR = ["#9CA3AF", "#9CA3AF", "#F59E0B", "#F97316", "#EF4444", "#DC2626"];

// Référentiels AFI
export const FILIERES = [
  { code: "BAF",  label: "Banque Assurance Finance" },
  { code: "QHSE", label: "Qualité Hygiène Sécurité Environnement" },
  { code: "DEV",  label: "Développement Web" },
  { code: "SRT",  label: "Systèmes Réseaux et Télécommunications" },
  { code: "MMC",  label: "Marketing Management et Communication" },
  { code: "MJF",  label: "Management Juridique et Fiscal" },
  { code: "GRH",  label: "Gestion des Ressources Humaines" },
  { code: "MAI",  label: "Management des Affaires Internationales" },
  { code: "TL",   label: "Transport et Logistique" },
  { code: "GSE",  label: "Gestion et Stratégie d'Entreprise" },
  { code: "IJF",  label: "Ingénieur Juridique et Fiscal" },
  { code: "GFCE", label: "Gestion Financière, Fiscale et Comptable" },
  { code: "GFAE", label: "Gestion Finance" },
];

export const NIVEAUX = [
  { code: "L1", label: "Licence 1" },
  { code: "L2", label: "Licence 2" },
  { code: "L3", label: "Licence 3" },
  { code: "M1", label: "Master 1" },
  { code: "M2", label: "Master 2" },
];

export const SITES = ["AFI_SIEGE", "AFITECH", "AFIPOINT_E", "LYCEE"];

export const SEMESTRES = ["S1", "S2"];

// Items de navigation sidebar
export const NAV_ITEMS = [
  { id: "dashboard",    icon: "▦",  label: "Dashboard"     },
  { id: "signalements", icon: "◉",  label: "Signalements"  },
  { id: "notes",        icon: "📝", label: "Notes"          },
  { id: "planning",     icon: "◷",  label: "Planning"       },
  { id: "infos",        icon: "📣", label: "Infos & News"   },
  { id: "utilisateurs", icon: "◎",  label: "Utilisateurs"  },
];

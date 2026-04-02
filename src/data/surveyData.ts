export interface Activity {
  id: string;
  label: string;
  subActivities: string[];
}

export const activities: Activity[] = [
  {
    id: "prospection",
    label: "Prospection commerciale",
    subActivities: [
      "Faire une veille AO",
      "Réaliser des prises de contact et relances",
      "Identifier les prospects pertinents (scoring)",
    ],
  },
  {
    id: "chiffrage",
    label: "Chiffrage / devis / appels d'offres",
    subActivities: [
      "Analyser le besoin client ou le dossier de consultation",
      "Réaliser le chiffrage et construire la proposition",
      "Rédiger et déposer le devis ou la réponse à l'appel d'offres",
    ],
  },
  {
    id: "relation-client",
    label: "Relation client / suivi commercial",
    subActivities: [
      "Assurer le traitement des sollicitations",
      "Assurer le suivi courant de la relation",
      "Gérer les problèmes ou tensions",
    ],
  },
  {
    id: "communication",
    label: "Communication et coordination",
    subActivities: [
      "Créer les supports de communication",
      "Diffuser les bonnes informations aux bons interlocuteurs",
      "Coordonner les échanges entre équipes, clients et partenaires",
    ],
  },
  {
    id: "etudes",
    label: "Études techniques / préparation",
    subActivities: [
      "Analyser les contraintes techniques du projet",
      "Produire les éléments de préparation",
      "Vérifier la conformité technique avant lancement",
    ],
  },
  {
    id: "chantier",
    label: "Gestion de chantier / suivi d'exécution",
    subActivities: [
      "Planifier et organiser les interventions sur chantier",
      "Suivre l'avancement, les aléas et les besoins en cours d'exécution",
      "Assurer le reporting et la traçabilité du chantier",
    ],
  },
  {
    id: "atelier",
    label: "Gestion de l'atelier / production / maintenance matériel",
    subActivities: [
      "Planifier les activités de l'atelier",
      "Suivre la production, les interventions ou la préparation du matériel",
      "Assurer l'entretien et la disponibilité des équipements",
    ],
  },
  {
    id: "achats",
    label: "Gestion des achats, commandes et stocks",
    subActivities: [
      "Identifier les besoins en achats et approvisionnements",
      "Passer et suivre les commandes fournisseurs",
      "Suivre les niveaux de stock et les mouvements de matériel",
    ],
  },
  {
    id: "facturation",
    label: "Facturation / règlements / administratif",
    subActivities: [
      "Transformer les devis en factures et documents administratifs",
      "Suivre les paiements, échéances et relances",
      "Vérifier la conformité administrative des dossiers",
    ],
  },
  {
    id: "rh",
    label: "Gestion RH / planning / administratif du personnel",
    subActivities: [
      "Recruter et intégrer les collaborateurs",
      "Planifier les équipes, disponibilités et remplacements",
      "Gérer le suivi administratif du personnel",
    ],
  },
  {
    id: "pilotage",
    label: "Pilotage / tableaux de bord / reporting",
    subActivities: [
      "Collecter et consolider les données d'activité",
      "Produire les tableaux de bord et indicateurs de suivi",
      "Partager les reportings pour aider à la décision",
    ],
  },
  {
    id: "controle",
    label: "Contrôle de gestion / rentabilité",
    subActivities: [
      "Suivre les coûts, marges et rentabilité",
      "Analyser les écarts",
      "Identifier les leviers d'optimisation",
    ],
  },
  {
    id: "sav",
    label: "SAV / gestion des réclamations",
    subActivities: [
      "Recevoir et qualifier les demandes",
      "Planifier les interventions",
      "Assurer la clôture des dossiers",
    ],
  },
];

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface SurveyResponse {
  response_id: string;
  timestamp: string;
  q1_selected_activities: string[];
  q1_sub_answers: Record<string, string>;
  q1_comments: Record<string, string>;
  q2_selected_activities: string[];
  q2_sub_answers: Record<string, string>;
  q2_comments: Record<string, string>;
  q3_selected_activity: string;
  q3_comment: string;
}

export function getResponses(): SurveyResponse[] {
  try {
    return JSON.parse(localStorage.getItem("survey_responses") || "[]");
  } catch {
    return [];
  }
}

export async function saveResponse(response: SurveyResponse): Promise<void> {
  try {
    // Save to Supabase
    const { error } = await supabase
      .from('survey_responses')
      .insert([response]);

    if (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }

    // Also save locally as backup
    const responses = getResponses();
    responses.push(response);
    localStorage.setItem("survey_responses", JSON.stringify(responses));
  } catch (err) {
    console.error('Failed to save response:', err);
    // Fallback to localStorage only
    const responses = getResponses();
    responses.push(response);
    localStorage.setItem("survey_responses", JSON.stringify(responses));
  }
}

export function clearResponses() {
  localStorage.removeItem("survey_responses");
  document.cookie = "survey_done=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import SurveyHeader from "@/components/SurveyHeader";
import ProgressBar from "@/components/ProgressBar";
import ActivityCard from "@/components/ActivityCard";
import SubActivityCard from "@/components/SubActivityCard";
import { activities, saveResponse, type SurveyResponse } from "@/data/surveyData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CommentField = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) => (
  <div className="mt-4 pt-4 border-t border-border">
    <label className="font-body text-sm text-muted-foreground block mb-2">
      {label || "Autre / Commentaire (optionnel)"}
    </label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Précisez ici..."
      className="resize-none text-sm"
      rows={2}
      maxLength={500}
    />
  </div>
);

type Step =
  | "intro"
  | "q1"
  | "q1-sub"
  | "q2"
  | "q2-sub"
  | "q3"
  | "done";

const Survey = () => {
  const [alreadyDone] = useState(() => Cookies.get("survey_done") === "1");
  const [step, setStep] = useState<Step>("intro");
  const [q1, setQ1] = useState<string[]>([]);
  const [q1Sub, setQ1Sub] = useState<Record<string, string>>({});
  const [q1Comments, setQ1Comments] = useState<Record<string, string>>({});
  const [q1SubIdx, setQ1SubIdx] = useState(0);
  const [q2, setQ2] = useState<string[]>([]);
  const [q2Sub, setQ2Sub] = useState<Record<string, string>>({});
  const [q2Comments, setQ2Comments] = useState<Record<string, string>>({});
  const [q2SubIdx, setQ2SubIdx] = useState(0);
  const [q3, setQ3] = useState<string>("");
  const [q3Comment, setQ3Comment] = useState("");
  const [error, setError] = useState("");

  const totalSteps = useMemo(() => {
    let t = 3;
    t += q1.length;
    t += q2.length;
    return t;
  }, [q1.length, q2.length]);

  const currentStep = useMemo(() => {
    if (step === "q1") return 1;
    if (step === "q1-sub") return 1 + q1SubIdx + 1;
    if (step === "q2") return 1 + q1.length + 1;
    if (step === "q2-sub") return 1 + q1.length + 1 + q2SubIdx + 1;
    if (step === "q3") return totalSteps;
    return 0;
  }, [step, q1SubIdx, q2SubIdx, q1.length, q2.length, totalSteps]);

  if (alreadyDone) {
    return (
      <div className="min-h-screen flex flex-col">
        <SurveyHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-card rounded-lg shadow-lg p-8 max-w-lg text-center">
            <h2 className="font-heading text-xl font-semibold mb-2">Vous avez déjà répondu</h2>
            <p className="text-muted-foreground font-body">Merci pour votre participation !</p>
          </div>
        </div>
        <footer className="py-4 text-center">
          <a href="/admin" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Administration
          </a>
        </footer>
      </div>
    );
  }

  const toggleQ1 = (id: string) => {
    setError("");
    setQ1((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const toggleQ2 = (id: string) => {
    setError("");
    setQ2((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const submit = async () => {
    const response: SurveyResponse = {
      response_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      q1_selected_activities: q1,
      q1_sub_answers: q1Sub,
      q1_comments: q1Comments,
      q2_selected_activities: q2,
      q2_sub_answers: q2Sub,
      q2_comments: q2Comments,
      q3_selected_activity: q3,
      q3_comment: q3Comment,
    };
    try {
      await saveResponse(response);
      Cookies.set("survey_done", "1", { expires: 365 });
      setStep("done");
    } catch (err) {
      console.error('Failed to submit response:', err);
      setError("Erreur lors de l'envoi. Veuillez réessayer.");
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const currentQ1Activity = q1[q1SubIdx] ? activities.find((a) => a.id === q1[q1SubIdx]) : null;
  const currentQ2Activity = q2[q2SubIdx] ? activities.find((a) => a.id === q2[q2SubIdx]) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <SurveyHeader />
      <main className="flex-1 flex flex-col items-center px-4 py-6 md:py-10">
        <div className="w-full max-w-2xl">
          {step !== "intro" && step !== "done" && (
            <div className="mb-6">
              <ProgressBar current={currentStep} total={totalSteps} />
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* INTRO */}
            {step === "intro" && (
              <motion.div key="intro" {...pageVariants} transition={{ duration: 0.35 }} className="bg-card rounded-xl shadow-lg p-6 md:p-10 text-center">
                <h1 className="font-heading text-2xl md:text-3xl font-bold mb-4">
                  Enquête Commission IA – Secteur BTP
                </h1>
                <p className="font-body text-muted-foreground mb-8 leading-relaxed">
                  Ce questionnaire vise à recueillir vos besoins et idées pour structurer les travaux de la future Commission IA. Vos réponses permettront de définir nos priorités stratégiques et technologiques.
                  <br /><br />
                  <strong>Temps estimé : 5 minutes.</strong>
                </p>
                <Button size="lg" className="text-base px-8" onClick={() => setStep("q1")}>
                  Commencer le questionnaire
                </Button>
              </motion.div>
            )}

            {/* Q1 */}
            {step === "q1" && (
              <motion.div key="q1" {...pageVariants} transition={{ duration: 0.35 }} className="bg-card rounded-xl shadow-lg p-6 md:p-10">
                <h2 className="font-heading text-lg md:text-xl font-semibold mb-2">Question 1</h2>
                <p className="font-body text-muted-foreground mb-6">
                  Parmi les activités suivantes, lesquelles vous font perdre le plus de temps au quotidien ? <strong>(3 choix maximum)</strong>
                </p>
                <div className="grid gap-3">
                  {activities.map((a) => (
                    <ActivityCard
                      key={a.id}
                      label={a.label}
                      selected={q1.includes(a.id)}
                      disabled={q1.length >= 3 && !q1.includes(a.id)}
                      onToggle={() => toggleQ1(a.id)}
                    />
                  ))}
                </div>
                <CommentField
                  value={q1Comments["_general"] || ""}
                  onChange={(v) => setQ1Comments((prev) => ({ ...prev, _general: v }))}
                  label="Autre activité ou commentaire (optionnel)"
                />
                {error && <p className="text-accent text-sm mt-3">{error}</p>}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => {
                      if (q1.length === 0) { setError("Veuillez sélectionner au moins une activité."); return; }
                      setQ1SubIdx(0);
                      setStep("q1-sub");
                    }}
                  >
                    Suivant
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Q1 SUB */}
            {step === "q1-sub" && currentQ1Activity && (
              <motion.div key={`q1-sub-${q1SubIdx}`} {...pageVariants} transition={{ duration: 0.35 }} className="bg-card rounded-xl shadow-lg p-6 md:p-10">
                <h2 className="font-heading text-lg md:text-xl font-semibold mb-1">
                  {currentQ1Activity.label}
                </h2>
                <p className="font-body text-muted-foreground mb-6">
                  Parmi les sous-activités suivantes, laquelle vous prend le plus de temps ?
                </p>
                <div className="grid gap-3">
                  {currentQ1Activity.subActivities.map((s) => (
                    <SubActivityCard
                      key={s}
                      label={s}
                      selected={q1Sub[currentQ1Activity.id] === s}
                      onSelect={() => { setError(""); setQ1Sub((prev) => ({ ...prev, [currentQ1Activity.id]: s })); }}
                    />
                  ))}
                </div>
                <CommentField
                  value={q1Comments[currentQ1Activity.id] || ""}
                  onChange={(v) => setQ1Comments((prev) => ({ ...prev, [currentQ1Activity.id]: v }))}
                />
                {error && <p className="text-accent text-sm mt-3">{error}</p>}
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => {
                    if (q1SubIdx > 0) setQ1SubIdx(q1SubIdx - 1);
                    else setStep("q1");
                  }}>
                    Retour
                  </Button>
                  <Button onClick={() => {
                    if (!q1Sub[currentQ1Activity.id]) { setError("Veuillez sélectionner une sous-activité."); return; }
                    if (q1SubIdx < q1.length - 1) setQ1SubIdx(q1SubIdx + 1);
                    else setStep("q2");
                  }}>
                    Suivant
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Q2 */}
            {step === "q2" && (
              <motion.div key="q2" {...pageVariants} transition={{ duration: 0.35 }} className="bg-card rounded-xl shadow-lg p-6 md:p-10">
                <h2 className="font-heading text-lg md:text-xl font-semibold mb-2">Question 2</h2>
                <p className="font-body text-muted-foreground mb-6">
                  Parmi les activités suivantes, lesquelles sont les plus difficiles à réaliser aujourd'hui dans votre entreprise ? <strong>(3 choix maximum)</strong>
                </p>
                <div className="grid gap-3">
                  {activities.map((a) => (
                    <ActivityCard
                      key={a.id}
                      label={a.label}
                      selected={q2.includes(a.id)}
                      disabled={q2.length >= 3 && !q2.includes(a.id)}
                      onToggle={() => toggleQ2(a.id)}
                    />
                  ))}
                </div>
                <CommentField
                  value={q2Comments["_general"] || ""}
                  onChange={(v) => setQ2Comments((prev) => ({ ...prev, _general: v }))}
                  label="Autre activité ou commentaire (optionnel)"
                />
                {error && <p className="text-accent text-sm mt-3">{error}</p>}
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => { setQ1SubIdx(q1.length - 1); setStep("q1-sub"); }}>Retour</Button>
                  <Button onClick={() => {
                    if (q2.length === 0) { setError("Veuillez sélectionner au moins une activité."); return; }
                    setQ2SubIdx(0);
                    setStep("q2-sub");
                  }}>
                    Suivant
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Q2 SUB */}
            {step === "q2-sub" && currentQ2Activity && (
              <motion.div key={`q2-sub-${q2SubIdx}`} {...pageVariants} transition={{ duration: 0.35 }} className="bg-card rounded-xl shadow-lg p-6 md:p-10">
                <h2 className="font-heading text-lg md:text-xl font-semibold mb-1">
                  {currentQ2Activity.label}
                </h2>
                <p className="font-body text-muted-foreground mb-6">
                  Parmi les sous-activités suivantes, laquelle est la plus difficile à réaliser ?
                </p>
                <div className="grid gap-3">
                  {currentQ2Activity.subActivities.map((s) => (
                    <SubActivityCard
                      key={s}
                      label={s}
                      selected={q2Sub[currentQ2Activity.id] === s}
                      onSelect={() => { setError(""); setQ2Sub((prev) => ({ ...prev, [currentQ2Activity.id]: s })); }}
                    />
                  ))}
                </div>
                <CommentField
                  value={q2Comments[currentQ2Activity.id] || ""}
                  onChange={(v) => setQ2Comments((prev) => ({ ...prev, [currentQ2Activity.id]: v }))}
                />
                {error && <p className="text-accent text-sm mt-3">{error}</p>}
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => {
                    if (q2SubIdx > 0) setQ2SubIdx(q2SubIdx - 1);
                    else setStep("q2");
                  }}>
                    Retour
                  </Button>
                  <Button onClick={() => {
                    if (!q2Sub[currentQ2Activity.id]) { setError("Veuillez sélectionner une sous-activité."); return; }
                    if (q2SubIdx < q2.length - 1) setQ2SubIdx(q2SubIdx + 1);
                    else setStep("q3");
                  }}>
                    Suivant
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Q3 */}
            {step === "q3" && (
              <motion.div key="q3" {...pageVariants} transition={{ duration: 0.35 }} className="bg-card rounded-xl shadow-lg p-6 md:p-10">
                <h2 className="font-heading text-lg md:text-xl font-semibold mb-2">Question 3</h2>
                <p className="font-body text-muted-foreground mb-6">
                  Parmi ces activités, lesquelles aimeriez-vous davantage développer ou mieux traiter, mais que vous ne faites pas assez aujourd'hui faute de temps ?
                </p>
                <div className="grid gap-3">
                  {activities.map((a) => (
                    <ActivityCard
                      key={a.id}
                      label={a.label}
                      selected={q3 === a.id}
                      onToggle={() => { setError(""); setQ3(a.id); }}
                    />
                  ))}
                </div>
                <CommentField
                  value={q3Comment}
                  onChange={setQ3Comment}
                  label="Autre activité ou commentaire (optionnel)"
                />
                {error && <p className="text-accent text-sm mt-3">{error}</p>}
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => { setQ2SubIdx(q2.length - 1); setStep("q2-sub"); }}>Retour</Button>
                  <Button onClick={() => {
                    if (!q3) { setError("Veuillez sélectionner une activité."); return; }
                    submit();
                  }}>
                    Envoyer mes réponses
                  </Button>
                </div>
              </motion.div>
            )}

            {/* DONE */}
            {step === "done" && (
              <motion.div key="done" {...pageVariants} transition={{ duration: 0.35 }} className="bg-card rounded-xl shadow-lg p-6 md:p-10 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="font-heading text-2xl font-bold mb-4">Merci pour votre retour !</h2>
                <p className="font-body text-muted-foreground leading-relaxed">
                  Cela nous permettra d'enrichir nos échanges.<br />
                  Rendez-vous le <strong>5 mai 2026</strong> pour notre prochaine commission IA.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <footer className="py-4 text-center">
        <a href="/admin" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          Administration
        </a>
      </footer>
    </div>
  );
};

export default Survey;
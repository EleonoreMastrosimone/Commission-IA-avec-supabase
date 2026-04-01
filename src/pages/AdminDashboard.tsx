import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import * as XLSX from "xlsx";
import SurveyHeader from "@/components/SurveyHeader";
import { activities, getResponses, clearResponses, type SurveyResponse } from "@/data/surveyData";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, LogOut, ChevronDown, ChevronRight, Trash2, MessageSquare } from "lucide-react";

const COLORS = [
  "hsl(172,87%,32%)", "hsl(228,38%,55%)", "hsl(11,77%,58%)", "hsl(40,100%,69%)",
  "hsl(172,87%,42%)", "hsl(228,38%,65%)", "hsl(11,77%,48%)", "hsl(40,100%,59%)",
  "hsl(172,87%,25%)", "hsl(228,38%,45%)", "hsl(11,77%,68%)", "hsl(40,100%,49%)", "hsl(200,50%,50%)",
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showComments, setShowComments] = useState(false);

  const refresh = useCallback(() => {
    setResponses(getResponses());
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") !== "1") {
      navigate("/admin");
      return;
    }
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [navigate, refresh]);

  const actMap = useMemo(() => Object.fromEntries(activities.map((a) => [a.id, a.label])), []);

  const buildFreq = (key: "q1_selected_activities" | "q2_selected_activities") =>
    activities.map((a) => ({
      name: a.label,
      id: a.id,
      count: responses.filter((r) => r[key].includes(a.id)).length,
    })).sort((a, b) => b.count - a.count);

  const q1Data = useMemo(() => buildFreq("q1_selected_activities"), [responses]);
  const q2Data = useMemo(() => buildFreq("q2_selected_activities"), [responses]);
  const q3Data = useMemo(() =>
    activities.map((a) => ({
      name: a.label,
      id: a.id,
      count: responses.filter((r) => r.q3_selected_activity === a.id).length,
    })).sort((a, b) => b.count - a.count),
    [responses]
  );

  const buildSubFreq = (qKey: "q1_sub_answers" | "q2_sub_answers", activityId: string) => {
    const act = activities.find((a) => a.id === activityId);
    if (!act) return [];
    return act.subActivities.map((s) => ({
      name: s,
      count: responses.filter((r) => r[qKey]?.[activityId] === s).length,
    }));
  };

  const toggleSub = (key: string) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleReset = () => {
    if (window.confirm("⚠️ Êtes-vous sûr de vouloir supprimer toutes les réponses ? Cette action est irréversible.")) {
      clearResponses();
      refresh();
    }
  };

  // Collect all comments
  const allComments = useMemo(() => {
    const comments: { question: string; context: string; text: string; date: string }[] = [];
    responses.forEach((r) => {
      // Q1 comments
      if (r.q1_comments) {
        Object.entries(r.q1_comments).forEach(([key, val]) => {
          if (val?.trim()) {
            comments.push({
              question: "Q1",
              context: key === "_general" ? "Commentaire général" : (actMap[key] || key),
              text: val,
              date: new Date(r.timestamp).toLocaleDateString("fr-FR"),
            });
          }
        });
      }
      // Q2 comments
      if (r.q2_comments) {
        Object.entries(r.q2_comments).forEach(([key, val]) => {
          if (val?.trim()) {
            comments.push({
              question: "Q2",
              context: key === "_general" ? "Commentaire général" : (actMap[key] || key),
              text: val,
              date: new Date(r.timestamp).toLocaleDateString("fr-FR"),
            });
          }
        });
      }
      // Q3 comment
      if (r.q3_comment?.trim()) {
        comments.push({
          question: "Q3",
          context: "Commentaire général",
          text: r.q3_comment,
          date: new Date(r.timestamp).toLocaleDateString("fr-FR"),
        });
      }
    });
    return comments;
  }, [responses, actMap]);

  const buildExportRows = () =>
    responses.map((r) => ({
      ID: r.response_id,
      Date: r.timestamp,
      Q1_Activités: r.q1_selected_activities.map((id) => actMap[id]).join(" | "),
      ...Object.fromEntries(
        Object.entries(r.q1_sub_answers).map(([k, v]) => [`Q1_Sub_${actMap[k] || k}`, v])
      ),
      ...Object.fromEntries(
        Object.entries(r.q1_comments || {}).filter(([, v]) => v?.trim()).map(([k, v]) => [`Q1_Comment_${k === "_general" ? "Général" : (actMap[k] || k)}`, v])
      ),
      Q2_Activités: r.q2_selected_activities.map((id) => actMap[id]).join(" | "),
      ...Object.fromEntries(
        Object.entries(r.q2_sub_answers).map(([k, v]) => [`Q2_Sub_${actMap[k] || k}`, v])
      ),
      ...Object.fromEntries(
        Object.entries(r.q2_comments || {}).filter(([, v]) => v?.trim()).map(([k, v]) => [`Q2_Comment_${k === "_general" ? "Général" : (actMap[k] || k)}`, v])
      ),
      Q3_Activité: actMap[r.q3_selected_activity] || r.q3_selected_activity,
      Q3_Commentaire: r.q3_comment || "",
    }));

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildExportRows()), "Réponses");
    XLSX.writeFile(wb, "resultats_enquete_ia_btp.xlsx");
  };

  const exportCSV = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildExportRows()), "Réponses");
    XLSX.writeFile(wb, "resultats_enquete_ia_btp.csv", { bookType: "csv" });
  };

  const ChartBlock = ({ title, data, qSubKey }: { title: string; data: { name: string; id: string; count: number }[]; qSubKey?: "q1_sub_answers" | "q2_sub_answers" }) => (
    <div className="bg-card rounded-xl shadow p-4 md:p-6 mb-6">
      <h3 className="font-heading text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 42)}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={240} tick={{ fontSize: 12, fontFamily: "DM Sans" }} />
          <Tooltip contentStyle={{ borderRadius: 8, fontFamily: "DM Sans" }} />
          <Bar dataKey="count" name="Sélections" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {qSubKey && (
        <div className="mt-4 space-y-2">
          <h4 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wide">Détail sous-activités</h4>
          {data.filter((d) => d.count > 0).map((d) => {
            const key = `${qSubKey}-${d.id}`;
            const isOpen = expandedSubs.has(key);
            const subData = buildSubFreq(qSubKey, d.id);
            return (
              <div key={key} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSub(key)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="font-body text-sm font-medium">{d.name}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs font-heading font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{d.count}</span>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-border p-3 bg-muted/20">
                    <ResponsiveContainer width="100%" height={subData.length * 40 + 30}>
                      <BarChart data={subData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={280} tick={{ fontSize: 11, fontFamily: "DM Sans" }} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontFamily: "DM Sans" }} />
                        <Bar dataKey="count" name="Sélections" fill="hsl(172,87%,32%)" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SurveyHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold">Tableau de bord</h1>
              <p className="text-muted-foreground text-xs font-body mt-1">
                Dernière mise à jour : {lastRefresh.toLocaleTimeString("fr-FR")} · rafraîchissement auto toutes les 15s
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={refresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
              </Button>
              <Button onClick={exportExcel} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button onClick={exportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button onClick={() => setShowComments(!showComments)} variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-1" /> Commentaires{allComments.length > 0 && ` (${allComments.length})`}
              </Button>
              <Button onClick={handleReset} variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" /> Réinitialiser
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { sessionStorage.removeItem("admin_auth"); navigate("/admin"); }}>
                <LogOut className="h-4 w-4 mr-1" /> Déconnexion
              </Button>
            </div>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-card rounded-xl shadow p-6 text-center">
              <p className="text-4xl font-heading font-bold text-primary">{responses.length}</p>
              <p className="text-muted-foreground font-body text-sm mt-1">Participants</p>
            </div>
            <div className="bg-card rounded-xl shadow p-6 text-center">
              <p className="text-4xl font-heading font-bold text-secondary">{responses.length > 0 ? "100%" : "—"}</p>
              <p className="text-muted-foreground font-body text-sm mt-1">Taux de complétion</p>
            </div>
          </div>

          {/* Comments section */}
          {showComments && (
            <div className="bg-card rounded-xl shadow p-4 md:p-6 mb-6">
              <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Commentaires libres
              </h3>
              {allComments.length === 0 ? (
                <p className="text-muted-foreground font-body text-sm">Aucun commentaire pour le moment.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allComments.map((c, i) => (
                    <div key={i} className="border border-border rounded-lg p-3 bg-muted/10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-heading font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c.question}</span>
                        <span className="text-xs text-muted-foreground font-body">{c.context}</span>
                        <span className="text-xs text-muted-foreground/60 ml-auto">{c.date}</span>
                      </div>
                      <p className="font-body text-sm">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {responses.length === 0 && (
            <div className="bg-card rounded-xl shadow p-8 text-center mb-8">
              <p className="text-muted-foreground font-body">Aucune réponse pour le moment. Les graphiques apparaîtront dès qu'un participant aura complété l'enquête.</p>
            </div>
          )}

          {responses.length > 0 && (
            <>
              <ChartBlock title="Q1 — Activités qui font perdre le plus de temps" data={q1Data} qSubKey="q1_sub_answers" />
              <ChartBlock title="Q2 — Activités les plus difficiles à réaliser" data={q2Data} qSubKey="q2_sub_answers" />
              <ChartBlock title="Q3 — Activités à développer davantage" data={q3Data} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
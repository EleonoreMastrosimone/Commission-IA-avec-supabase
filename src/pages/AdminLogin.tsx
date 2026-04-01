import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SurveyHeader from "@/components/SurveyHeader";

const ADMIN_PASS = "commission-ia-2026";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      sessionStorage.setItem("admin_auth", "1");
      navigate("/admin/dashboard");
    } else {
      setError("Mot de passe incorrect.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SurveyHeader />
      <main className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-card rounded-xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="font-heading text-xl font-bold mb-6 text-center">Administration</h1>
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            className="mb-3"
          />
          {error && <p className="text-accent text-sm mb-3">{error}</p>}
          <Button type="submit" className="w-full">Se connecter</Button>
        </form>
      </main>
    </div>
  );
};

export default AdminLogin;

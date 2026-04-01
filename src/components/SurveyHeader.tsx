import logoAneol from "@/assets/logo-aneol.png";
import logoFfb from "@/assets/logo-ffb.jpg";

const SurveyHeader = () => (
  <header className="w-full bg-card shadow-sm px-4 py-3">
    <div className="container flex items-center justify-between">
      <img src={logoAneol} alt="Aneol" className="h-8 md:h-10 bg-foreground rounded-sm p-1" />
      <img src={logoFfb} alt="Fédération du BTP" className="h-10 md:h-14" />
    </div>
  </header>
);

export default SurveyHeader;

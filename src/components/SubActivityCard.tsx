import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SubActivityCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

const SubActivityCard = ({ label, selected, onSelect }: SubActivityCardProps) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.97 }}
    onClick={onSelect}
    className={cn(
      "w-full text-left rounded-lg border-2 p-3 transition-colors duration-200 font-body text-sm",
      selected
        ? "border-secondary bg-secondary/10 shadow-md"
        : "border-border bg-card hover:border-secondary/40"
    )}
  >
    {label}
  </motion.button>
);

export default SubActivityCard;

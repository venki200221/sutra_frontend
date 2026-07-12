import { useEffect } from "react";

export default function DemoForm({ open, onClose }) {
  useEffect(() => {
    // Load Formester script once
    if (!document.getElementById("formester-script")) {
      const script = document.createElement("script");
      script.id = "formester-script";
      script.src = "https://cdn.formester.com/widgets/popup.js";
      script.async = true;
      document.body.appendChild(script);
    }

    if (open) {
      const timer = setTimeout(() => {
        if (window.Formester) {
          window.Formester.openPopup("iGN58h2Jq");
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Register Formester popup */}
      <formester-popup
        id="iGN58h2Jq"
        url="https://vvxuidvq.formester.com/f/iGN58h2Jq"
        width="1000px"
        height="95%"
      ></formester-popup>

      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
    </>
  );
}

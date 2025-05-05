import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/welcome");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return <h1>BLAST</h1>;
}

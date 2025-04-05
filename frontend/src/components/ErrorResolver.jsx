import { useState } from "react";

const ErrorResolver = ({ error, code }) => {
  const [solution, setSolution] = useState("");

  const handleResolve = async () => {
    const response = await fetch("https://collab-code-platform-server.onrender.com/api/ai/resolve-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error, code }),
    });
    const data = await response.json();
    setSolution(data.solution);
  };

  return (
    <div className="error-resolver">
      <button onClick={handleResolve}>Fix Error</button>
      {solution && <pre>{solution}</pre>}
    </div>
  );
};

export default ErrorResolver;
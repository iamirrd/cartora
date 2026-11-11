import { useRef, useState } from "react";

export function useAction() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function run(action, success = "") {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch (problem) {
      setError(problem.message);
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return { pending, error, message, run };
}

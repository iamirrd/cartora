import { useEffect, useState } from "react";
import { get, list } from "../api/client.js";

export function useResource(path, all = false) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    path,
    status: "loading",
    data: null,
    error: "",
  });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    let active = true;
    setState({ path, status: "loading", data: null, error: "" });
    (all ? list : get)(path, controller.signal)
      .then((data) => {
        if (active) setState({ path, status: "success", data, error: "" });
      })
      .catch((error) => {
        if (active && error.name !== "AbortError")
          setState({ path, status: "error", data: null, error: error.message });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [path, all, attempt]);
  const current =
    state.path === path ? state : { status: "loading", data: null, error: "" };
  return { ...current, reload: () => setAttempt((value) => value + 1) };
}

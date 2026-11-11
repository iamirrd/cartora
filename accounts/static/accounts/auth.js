// Progressive enhancement: submitting the Django form also works without JavaScript.
const toggle = document.querySelector(".password-toggle");
const password = document.querySelector('input[name="password"]');
if (toggle && password) {
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(show));
    toggle.setAttribute(
      "aria-label",
      show ? "پنهان کردن رمز عبور" : "نمایش رمز عبور",
    );
  });
}

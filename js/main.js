/* main.js — Page interactions */

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add("visible"), i * 80);
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(".card, .info-card").forEach(el => observer.observe(el));

// Subscribe form
function handleSubscribe(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  btn.textContent = "✅ You're in!";
  btn.style.background = "#4A7C59";
  e.target.querySelector("input").value = "";
  setTimeout(() => { btn.textContent = "Subscribe Free →"; btn.style.background = ""; }, 3000);
}

// Comportamentos gerais da Home
document.addEventListener("DOMContentLoaded", () => {
  const spanAno = document.getElementById("ano-atual");
  if (spanAno) {
    spanAno.textContent = new Date().getFullYear();
  }
});

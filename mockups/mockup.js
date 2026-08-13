// Mockup interactions: A/B variant toggle (mockup chrome only) + demo video modal.

// ── Variant toggle ─────────────────────────────────────────
const toggle = document.createElement("div");
toggle.id = "mockup-toggle";
toggle.innerHTML = `
	<span>MOCKUP&nbsp;·&nbsp;cards:</span>
	<button data-v="posters" type="button">Posters</button>
	<button data-v="text" type="button">Text-only</button>
	<span>·&nbsp;grid:</span>
	<button data-c="2" type="button">2/row</button>
	<button data-c="3" type="button">3/row</button>
`;
document.body.appendChild(toggle);

function setVariant(v) {
	document.body.dataset.variant = v;
	toggle.querySelectorAll("button").forEach((b) =>
		b.classList.toggle("active", b.dataset.v === v),
	);
}
function setCols(c) {
	document.body.dataset.cols = c;
	toggle.querySelectorAll("button[data-c]").forEach((b) =>
		b.classList.toggle("active", b.dataset.c === c),
	);
}
toggle.addEventListener("click", (e) => {
	if (e.target.dataset.v) setVariant(e.target.dataset.v);
	if (e.target.dataset.c) setCols(e.target.dataset.c);
});
setVariant("posters");
setCols("3");

// ── Demo modal ─────────────────────────────────────────────
const dialog = document.getElementById("demo-modal");
const video = dialog.querySelector("video");
const webmSource = dialog.querySelector("source[type='video/webm']");
const mp4Source = dialog.querySelector("source[type='video/mp4']");
const modalTitle = dialog.querySelector(".modal-title");

document.addEventListener("click", (e) => {
	const trigger = e.target.closest("[data-demo]");
	if (!trigger) return;
	e.preventDefault();
	webmSource.src = trigger.dataset.webm;
	mp4Source.src = trigger.dataset.mp4;
	modalTitle.textContent = trigger.dataset.title;
	video.load();
	dialog.showModal();
	video.play().catch(() => {});
});

function closeModal() {
	video.pause();
	dialog.close();
}
dialog.querySelector(".modal-close").addEventListener("click", closeModal);
dialog.addEventListener("click", (e) => {
	if (e.target === dialog) closeModal();
});
dialog.addEventListener("close", () => video.pause());

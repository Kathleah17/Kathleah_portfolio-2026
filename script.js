// Register the plugin
gsap.registerPlugin(ScrollTrigger);

// Target all project cards
const cards = document.querySelectorAll(".project-card");

cards.forEach((card, index) => {
    gsap.to(card, {
        scrollTrigger: {
            trigger: card,
            start: "top 80%",    // Animation starts when top of card hits 80% of viewport
            toggleActions: "play none none none", // Play once on entry
        },
        opacity: 1,
        y: 0,                    // Return to original position
        duration: 0.8,
        delay: index * 0.2,      // Stagger effect: each card starts 0.2s after the previous
        ease: "power2.out"
    });
});
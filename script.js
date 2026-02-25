const INTRO_MS = 5000;
const MIN_BEAT_INTERVAL_MS = 260;
const DEFAULT_MAX_SILENCE_SLIDE_MS = 2600;
const MIN_SLIDE_GAP_MS = 1700;
const END_BUFFER_MS = 3200;
const BEAT_SYNC_WINDOW_MS = 220;

const effectClasses = ["effect-cinematic", "effect-glide", "effect-drift", "effect-parallax"];
const loveIcons = ["❤", "♥", "♡", "❥"];
const cozyIcons = ["❤", "♥", "♡", "❥"];

const dom = {
    intro: document.getElementById("intro"),
    startExperienceBtn: document.getElementById("startExperienceBtn"),
    loveRain: document.getElementById("loveRain"),
    experience: document.getElementById("experience"),
    slidesWrap: document.getElementById("slides"),
    slides: Array.from(document.querySelectorAll(".memory-slide")),
    slideIndicator: document.getElementById("slideIndicator"),
    memoryDate: document.getElementById("memoryDate"),
    memoryText: document.getElementById("memoryText"),
    finalAction: document.getElementById("finalAction"),
    revealSecretBtn: document.getElementById("revealSecretBtn"),
    secretModal: document.getElementById("secretModal"),
    secretRain: document.getElementById("secretRain"),
    closeSecret: document.getElementById("closeSecret"),
    bgSong: document.getElementById("bgSong")
};

const state = {
    rainTimer: null,
    currentSlide: -1,
    beatCount: 0,
    lastBeatTime: 0,
    lastSlideTime: 0,
    desiredSlideGapMs: DEFAULT_MAX_SILENCE_SLIDE_MS,
    beatIntervalMs: 540,
    maxSilenceSlideMs: DEFAULT_MAX_SILENCE_SLIDE_MS,
    syncStarted: false,
    isCompleted: false,
    isMusicPlaying: false,
    hasEverPlayed: false,
    awaitingUserGesture: false,
    audioCtx: null,
    analyser: null,
    frequencyData: null,
    energyHistory: [],
    rafId: null,
    autoSlideTimer: null,
    finalActionTimer: null,
    secretRainTimer: null,
    experienceStarted: false,
    lastMusicRetryAt: 0
};

function init() {
    initRevealObserver();
    bindAudioLifecycle();
    bindFirstInteractionKickstart();
    startIntro();
    bindSecretModal();
}

function bindFirstInteractionKickstart() {
    const kickstart = () => {
        if (state.hasEverPlayed || state.isMusicPlaying) return;
        playBackgroundSong();
    };

    document.addEventListener("pointerdown", kickstart, { once: true });
    document.addEventListener("keydown", kickstart, { once: true });
}

function initRevealObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function startIntro() {
    state.rainTimer = setInterval(spawnLoveDrop, 140);
    attemptSilentAutoplay();

    if (dom.startExperienceBtn) {
        dom.startExperienceBtn.addEventListener("click", () => {
            endIntro();
            startExperience();
        });
    }
}

function startIntroCountdown() {
    if (!dom.countdown) return;

    const startedAt = Date.now();
    const endsAt = startedAt + INTRO_MS;

    const render = () => {
        const remainingMs = Math.max(0, endsAt - Date.now());
        const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
        dom.countdown.textContent = `${seconds}`;
    };

    render();
    state.introCountdownTimer = setInterval(render, 200);
}

function spawnLoveDrop() {
    if (!dom.loveRain) return;

    const drop = document.createElement("span");
    drop.className = "love-drop";
    drop.textContent = loveIcons[Math.floor(Math.random() * loveIcons.length)];
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.setProperty("--fall-time", `${3.8 + Math.random() * 2.5}s`);
    drop.style.setProperty("--drift", `${Math.random() * 80 - 40}px`);

    dom.loveRain.appendChild(drop);
    setTimeout(() => drop.remove(), 6500);
}

function endIntro() {
    clearInterval(state.rainTimer);

    if (!dom.intro) return;
    dom.intro.classList.add("fade-out");
    setTimeout(() => {
        dom.intro.style.display = "none";
    }, 700);
}

function startExperience() {
    if (!dom.experience || state.experienceStarted) return;

    state.experienceStarted = true;

    dom.experience.classList.add("show");
    dom.experience.setAttribute("aria-hidden", "false");
    configureSongTiming();
    startSlideShow();
    playBackgroundSong();
}

function startSlideShow() {
    if (!dom.slides.length) return;

    showSlide(0);
    state.lastSlideTime = performance.now();

    if (state.autoSlideTimer) {
        clearInterval(state.autoSlideTimer);
    }

    state.autoSlideTimer = setInterval(() => {
        if (state.isCompleted) return;

        if (performance.now() - state.lastSlideTime > state.maxSilenceSlideMs) {
            tryNextSlide();
        }
    }, 260);
}

function tryNextSlide() {
    if (state.isCompleted) return;

    const next = state.currentSlide + 1;
    if (next >= dom.slides.length) {
        return;
    }

    showSlide(next);
    state.lastSlideTime = performance.now();
}

function showSlide(index) {
    if (state.currentSlide >= 0) {
        const oldSlide = dom.slides[state.currentSlide];
        oldSlide.classList.remove("active", ...effectClasses);
        oldSlide.classList.add("exit");
        setTimeout(() => oldSlide.classList.remove("exit"), 520);
    }

    const nextSlide = dom.slides[index];
    const effect = effectClasses[index % effectClasses.length];

    nextSlide.classList.remove("exit", ...effectClasses);
    nextSlide.classList.add("active", effect);

    state.currentSlide = index;
    if (dom.slideIndicator) dom.slideIndicator.textContent = `${index + 1} / ${dom.slides.length}`;
    if (dom.memoryDate) dom.memoryDate.textContent = nextSlide.dataset.date || "";
    if (dom.memoryText) dom.memoryText.textContent = nextSlide.dataset.text || "";

    if (index === dom.slides.length - 1 && !state.isCompleted) {
        state.isCompleted = true;
        if (state.autoSlideTimer) {
            clearInterval(state.autoSlideTimer);
            state.autoSlideTimer = null;
        }
        scheduleFinalActionReveal();
    }
}

function scheduleFinalActionReveal() {
    if (state.finalActionTimer) {
        clearTimeout(state.finalActionTimer);
    }

    state.finalActionTimer = setTimeout(() => {
        showFinalAction();
    }, 1500);
}

function showFinalAction() {
    if (!dom.finalAction) return;
    if (state.autoSlideTimer) {
        clearInterval(state.autoSlideTimer);
        state.autoSlideTimer = null;
    }
    
    const activeSlide = dom.slides[state.currentSlide];
    if (activeSlide) {
        const slideImg = activeSlide.querySelector("img");
        if (slideImg) slideImg.classList.add("blur-image");
    }
    
    dom.finalAction.hidden = false;
    requestAnimationFrame(() => {
        dom.finalAction.classList.add("show");
    });
}

function configureSongTiming() {
    if (!dom.bgSong) return;

    dom.bgSong.loop = true;

    const applyDurationTiming = () => {
        const duration = dom.bgSong.duration;
        if (!Number.isFinite(duration) || duration <= 0 || !dom.slides.length) return;

        const slideCount = dom.slides.length;
        const suggestedGap = (duration * 1000) / slideCount * 0.85;
        state.desiredSlideGapMs = Math.max(MIN_SLIDE_GAP_MS, Math.floor(suggestedGap));
        state.maxSilenceSlideMs = state.desiredSlideGapMs;
    };

    if (dom.bgSong.readyState >= 1) {
        applyDurationTiming();
    } else {
        dom.bgSong.addEventListener("loadedmetadata", applyDurationTiming, { once: true });
    }
}

function bindAudioLifecycle() {
    if (!dom.bgSong) return;

    dom.bgSong.addEventListener("play", () => {
        state.isMusicPlaying = true;
        state.hasEverPlayed = true;
        state.awaitingUserGesture = false;
        startMusicSyncLoop();
    });

    dom.bgSong.addEventListener("pause", () => {
        state.isMusicPlaying = false;
        if (state.rafId) {
            cancelAnimationFrame(state.rafId);
            state.rafId = null;
        }
    });
}

function bindUserGestureRetry() {
    if (state.awaitingUserGesture) return;
    state.awaitingUserGesture = true;

    const retry = () => {
        document.removeEventListener("pointerdown", retry);
        document.removeEventListener("keydown", retry);
        state.awaitingUserGesture = false;
        playBackgroundSong();
    };

    document.addEventListener("pointerdown", retry, { once: true });
    document.addEventListener("keydown", retry, { once: true });
}

async function setupAudioBeatSync() {
    if (!dom.bgSong || state.syncStarted) return false;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    const audioCtx = new AudioContextClass();
    try {
        if (audioCtx.state === "suspended") {
            await audioCtx.resume();
        }
    } catch {
        await audioCtx.close().catch(() => {});
        return false;
    }

    if (audioCtx.state !== "running") {
        await audioCtx.close().catch(() => {});
        return false;
    }

    state.audioCtx = audioCtx;
    const source = state.audioCtx.createMediaElementSource(dom.bgSong);
    state.analyser = state.audioCtx.createAnalyser();
    state.analyser.fftSize = 256;
    state.frequencyData = new Uint8Array(state.analyser.frequencyBinCount);

    source.connect(state.analyser);
    state.analyser.connect(state.audioCtx.destination);
    state.syncStarted = true;
    return true;
}

function startMusicSyncLoop() {
    if (!state.analyser || !state.frequencyData || state.rafId || !state.isMusicPlaying) return;

    const loop = () => {
        if (!state.analyser || !state.frequencyData || !state.isMusicPlaying) return;

        state.analyser.getByteFrequencyData(state.frequencyData);

        const bassBins = 14;
        let bassEnergy = 0;
        for (let i = 0; i < bassBins; i += 1) {
            bassEnergy += state.frequencyData[i];
        }
        bassEnergy /= bassBins;

        state.energyHistory.push(bassEnergy);
        if (state.energyHistory.length > 42) state.energyHistory.shift();

        const avgEnergy = state.energyHistory.reduce((sum, value) => sum + value, 0) / state.energyHistory.length;
        const now = performance.now();
        const beatDetected = bassEnergy > 44 && bassEnergy > avgEnergy * 1.28 && now - state.lastBeatTime > MIN_BEAT_INTERVAL_MS;

        if (beatDetected) {
            const previousBeatAt = state.lastBeatTime;
            state.lastBeatTime = now;
            state.beatCount += 1;
            pulseSlideOnBeat();

            if (previousBeatAt > 0) {
                const interval = now - previousBeatAt;
                state.beatIntervalMs = (state.beatIntervalMs * 0.75) + (interval * 0.25);
            }

            if (shouldAdvanceOnBeat(now)) {
                tryNextSlide();
            }
        }

        state.rafId = requestAnimationFrame(loop);
    };

    state.rafId = requestAnimationFrame(loop);
}

function shouldAdvanceOnBeat(now) {
    if (state.isCompleted || !state.isMusicPlaying) return false;
    if (state.currentSlide >= dom.slides.length - 1) return false;

    const elapsedSinceSlide = now - state.lastSlideTime;
    const target = state.desiredSlideGapMs;
    const beatWindow = Math.min(BEAT_SYNC_WINDOW_MS, Math.floor(state.beatIntervalMs * 0.35));

    return elapsedSinceSlide >= Math.max(MIN_SLIDE_GAP_MS, target - beatWindow);
}

function pulseSlideOnBeat() {
    if (!dom.slidesWrap) return;
    dom.slidesWrap.classList.remove("beat-hit");
    void dom.slidesWrap.offsetWidth;
    dom.slidesWrap.classList.add("beat-hit");
}

function bindSecretModal() {
    if (!dom.revealSecretBtn || !dom.secretModal || !dom.closeSecret) return;

    dom.revealSecretBtn.addEventListener("click", () => {
        dom.secretModal.classList.add("open");
        dom.secretModal.setAttribute("aria-hidden", "false");
        if (dom.experience) dom.experience.classList.add("blur-background");
        startSecretRain();
    });

    dom.closeSecret.addEventListener("click", closeSecretModal);
    dom.secretModal.addEventListener("click", (e) => {
        if (e.target === dom.secretModal) closeSecretModal();
    });
}

function closeSecretModal() {
    dom.secretModal.classList.remove("open");
    dom.secretModal.setAttribute("aria-hidden", "true");
    if (dom.experience) dom.experience.classList.remove("blur-background");
    
    const activeSlide = dom.slides[state.currentSlide];
    if (activeSlide) {
        const slideImg = activeSlide.querySelector("img");
        if (slideImg) slideImg.classList.remove("blur-image");
    }
    
    stopSecretRain();
}

function restartFromWishCard() {
    if (!dom.intro || !dom.experience) return;

    if (state.finalActionTimer) {
        clearTimeout(state.finalActionTimer);
        state.finalActionTimer = null;
    }

    if (state.autoSlideTimer) {
        clearInterval(state.autoSlideTimer);
        state.autoSlideTimer = null;
    }

    if (state.rainTimer) {
        clearInterval(state.rainTimer);
        state.rainTimer = null;
    }

    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }

    state.currentSlide = -1;
    state.beatCount = 0;
    state.lastBeatTime = 0;
    state.lastSlideTime = 0;
    state.isCompleted = false;
    state.isMusicPlaying = false;
    state.desiredSlideGapMs = DEFAULT_MAX_SILENCE_SLIDE_MS;
    state.beatIntervalMs = 540;
    state.energyHistory = [];
    state.experienceStarted = false;
    state.lastMusicRetryAt = 0;

    dom.slides.forEach((slide) => {
        slide.classList.remove("active", "exit", ...effectClasses);
    });

    if (dom.finalAction) {
        dom.finalAction.hidden = true;
        dom.finalAction.classList.remove("show");
    }

    if (dom.bgSong) {
        dom.bgSong.pause();
        dom.bgSong.currentTime = 0;
    }

    dom.experience.classList.remove("show");
    dom.experience.setAttribute("aria-hidden", "true");

    dom.intro.classList.remove("fade-out");
    dom.intro.style.display = "grid";

    startIntro();
}

function attemptSilentAutoplay() {
    if (!dom.bgSong || !dom.bgSong.paused) return;

    dom.bgSong.volume = 0.6;
    dom.bgSong.muted = true;

    const attempt = dom.bgSong.play();
    if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {
            bindUserGestureRetry();
        });
    }
}

function startSecretRain() {
    if (!dom.secretRain || state.secretRainTimer) return;

    state.secretRainTimer = setInterval(() => {
        spawnSecretDrop();
    }, 210);
}

function stopSecretRain() {
    if (state.secretRainTimer) {
        clearInterval(state.secretRainTimer);
        state.secretRainTimer = null;
    }

    if (!dom.secretRain) return;
    dom.secretRain.innerHTML = "";
}

function spawnSecretDrop() {
    if (!dom.secretRain) return;

    const drop = document.createElement("span");
    drop.className = "cozy-drop";
    drop.textContent = cozyIcons[Math.floor(Math.random() * cozyIcons.length)];
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.setProperty("--cozy-time", `${4.8 + Math.random() * 2.4}s`);
    drop.style.setProperty("--cozy-drift", `${Math.random() * 90 - 45}px`);

    dom.secretRain.appendChild(drop);
    setTimeout(() => {
        drop.remove();
    }, 7600);
}

function playBackgroundSong() {
    if (!dom.bgSong) return;

    dom.bgSong.volume = 0.6;
    dom.bgSong.muted = false;

    if (!dom.bgSong.paused) {
        if (state.syncStarted) {
            startMusicSyncLoop();
            return;
        }

        setupAudioBeatSync().then((isReady) => {
            if (isReady) startMusicSyncLoop();
        }).catch(() => {});
        return;
    }

    dom.bgSong.muted = true;
    const playAttempt = dom.bgSong.play();

    if (playAttempt && typeof playAttempt.then === "function") {
        playAttempt.then(() => {
            setTimeout(() => {
                dom.bgSong.muted = false;
            }, 250);

            if (state.syncStarted) {
                startMusicSyncLoop();
                return;
            }

            setupAudioBeatSync().then((isReady) => {
                if (isReady) startMusicSyncLoop();
            }).catch(() => {});
        }).catch(() => {
            bindUserGestureRetry();
            dom.bgSong.muted = true;
            dom.bgSong.play().then(() => {
                setTimeout(() => {
                    dom.bgSong.muted = false;
                }, 250);

                if (state.syncStarted) {
                    startMusicSyncLoop();
                    return;
                }

                setupAudioBeatSync().then((isReady) => {
                    if (isReady) startMusicSyncLoop();
                }).catch(() => {});
            }).catch(() => {
                dom.bgSong.muted = false;
                bindUserGestureRetry();
            });
        });
        return;
    }

    if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {
            bindUserGestureRetry();
            dom.bgSong.muted = true;
            dom.bgSong.play().then(() => {
                setTimeout(() => {
                    dom.bgSong.muted = false;
                }, 250);

                if (state.syncStarted) {
                    startMusicSyncLoop();
                    return;
                }

                setupAudioBeatSync().then((isReady) => {
                    if (isReady) startMusicSyncLoop();
                }).catch(() => {});
            }).catch(() => {
                dom.bgSong.muted = false;
                bindUserGestureRetry();
            });
        });
        return;
    }

    if (state.syncStarted) {
        startMusicSyncLoop();
        return;
    }

    setupAudioBeatSync().then((isReady) => {
        if (isReady) startMusicSyncLoop();
    }).catch(() => {});
}

document.addEventListener("DOMContentLoaded", init);

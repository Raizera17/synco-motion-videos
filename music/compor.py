"""Gera as trilhas originais (15s) de cada modelo: impacto.wav, elegante.wav, vibrante.wav"""
import numpy as np, wave, os
from scipy.signal import butter, sosfilt
SR = 44100; T = 15.5; N = int(SR * T)
def t_(d): return np.arange(int(SR * d)) / SR
def lp(x, c): return sosfilt(butter(2, c, 'low', fs=SR, output='sos'), x)
def hp(x, c): return sosfilt(butter(2, c, 'high', fs=SR, output='sos'), x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(b, x, t, g=1):
    s = int(t * SR)
    if s >= len(b): return
    e = min(len(b), s + len(x)); b[s:e] += x[:e - s] * g
def piano(f, d):
    tt = t_(d); env = np.exp(-tt * 2.2) * (1 - np.exp(-tt * 300))
    return sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * k * .8) for k, a in ((1, 1), (2, .35), (3, .12))) * env
def pad(f, d):
    tt = t_(d); env = np.minimum(1, tt / .8) * np.minimum(1, (d - tt) / .8)
    return (np.sin(2 * np.pi * f * tt) + .5 * np.sin(2 * np.pi * f * 1.003 * tt)) * env
def pluck(f, d):
    tt = t_(d); return (np.sin(2 * np.pi * f * tt) + .3 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 9)
def marimba(f, d):
    tt = t_(d); return (np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * 4 * f * tt) * np.exp(-tt * 30)) * np.exp(-tt * 6)
def kick():
    tt = t_(.35); return np.sin(2 * np.pi * (50 + 60 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9)
def hat(g=.05):
    n = int(.05 * SR); return hp(np.random.default_rng(n).standard_normal(n), 7000) * np.exp(-np.arange(n) / SR * 80) * g
def clap():
    n = int(.15 * SR); return lp(hp(np.random.default_rng(3).standard_normal(n), 1200), 5000) * np.exp(-np.arange(n) / SR * 25) * .25
def reverb(x):
    rv = np.zeros_like(x)
    for dl, g in ((.031, .3), (.047, .25), (.071, .2), (.113, .15), (.17, .1)):
        d = int(dl * SR); rv[d:] += x[:-d] * g
    return x + lp(rv, 4000) * .6
def salva(nome, mix):
    fade = np.ones(N); fade[:int(SR * .05)] = np.linspace(0, 1, int(SR * .05)); fade[-int(SR * 2):] = np.linspace(1, 0, int(SR * 2)) ** 1.5
    mix = np.tanh(mix * fade * 1.1); st = np.stack([mix, mix], 1); st = (st / np.abs(st).max() * .8 * 32767).astype(np.int16)
    w = wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), nome + '.wav'), 'wb')
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()

# ELEGANTE — piano calmo
bpm = 86; beat = 60 / bpm; bar = beat * 4
prog = [[57, 61, 64, 69], [56, 59, 64, 68], [54, 57, 61, 66], [50, 54, 57, 62]]; roots = [45, 44, 42, 38]
m = np.zeros(N)
for b in range(int(T / bar) + 1):
    ch = prog[b % 4]; st = b * bar
    for x in ch: add(m, lp(pad(hz(x), bar + .3), 3000), st, .045)
    add(m, lp(np.sin(2 * np.pi * hz(roots[b % 4]) * t_(bar)) * np.exp(-t_(bar) * .6), 400), st, .2)
    for i, k in enumerate([0, 2, 1, 3, 2, 1, 3, 2]): add(m, piano(hz(ch[k] + 12), 1.6), st + i * beat / 2, .08)
salva('elegante', reverb(m))

# IMPACTO — pulsante, moderno
bpm = 112; beat = 60 / bpm; bar = beat * 4
prog = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]]
m = np.zeros(N)
for b in range(int(T / bar) + 1):
    ch = prog[b % 4]; st = b * bar
    for i in range(4): add(m, kick(), st + i * beat, .55)
    for i in range(8): add(m, hat(.06 if i % 2 else .035), st + i * beat / 2)
    for i in (1, 3): add(m, clap(), st + i * beat)
    for i in range(8): add(m, lp(np.sign(np.sin(2 * np.pi * hz(ch[0] - 12) * t_(beat / 2))) * np.exp(-t_(beat / 2) * 6), 700), st + i * beat / 2, .1)
    for i, k in enumerate([1, 2, 3, 2, 1, 2, 3, 1]): add(m, pluck(hz(ch[k] + 12), .5), st + i * beat / 2, .07)
    for x in ch[1:]: add(m, lp(pad(hz(x), bar), 1800), st, .025)
salva('impacto', reverb(m))

# VIBRANTE — leve e alegre (marimba)
bpm = 100; beat = 60 / bpm; bar = beat * 4
prog = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]; roots = [36, 33, 29, 31]
m = np.zeros(N)
for b in range(int(T / bar) + 1):
    ch = prog[b % 4]; st = b * bar
    pat = [0, 2, 3, 2, 1, 2, 3, 2]
    for i, k in enumerate(pat): add(m, marimba(hz(ch[k] + 12), .6), st + i * beat / 2, .09)
    for i in (0, 1.5, 2.5): add(m, lp(np.sin(2 * np.pi * hz(roots[b % 4]) * t_(beat)) * np.exp(-t_(beat) * 3), 300), st + i * beat, .22)
    for i in range(4): add(m, hat(.03), st + i * beat + beat / 2)
    if b >= 1:
        for i in (1, 3): add(m, clap() * .6, st + i * beat)
    for x in ch[1:]: add(m, lp(pad(hz(x), bar), 2500), st, .02)
salva('vibrante', reverb(m))
print('trilhas ok')

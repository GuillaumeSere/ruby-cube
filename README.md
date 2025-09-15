# Three.js Rubik's Cube

Une petite application web interactive affichant un Rubik's Cube 3D, construite avec Three.js et Vite.

## Description

Cette démo propose:
- Un rendu 3D du cube (27 cubies) avec les six faces colorées.
- Contrôles de caméra (orbite) pour visualiser le cube sous tous les angles.
- Boutons pour tourner chaque face dans le sens horaire (↻) ou anti‑horaire (↺), comme sur un vrai Rubik's Cube.
- Boutons `Scramble` et `Reset` pour mélanger et remettre le cube à l'état initial.
- Animations douces (GSAP) pour les rotations.

Le code est volontairement simple pour rester pédagogique: la logique met à jour une représentation discrète des positions des cubies (coordonnées -1,0,1) et applique des rotations de 90°.

## Arborescence

- `index.html` — point d'entrée
- `package.json` — dépendances et scripts
- `src/main.js` — bootstrap de l'application
- `src/styles.css` — styles basiques
- `src/components/RubiksCube.js` — scène Three.js, génération des cubies et logique des rotations

## Prérequis
- Node.js 16+ et `npm` installés

## Installation et exécution (PowerShell)

```powershell
cd C:\Users\DELL\Desktop\ruby-cube
npm install
npm run dev
```

Ouvrir l'URL fournie par Vite (généralement `http://localhost:5173`) dans un navigateur moderne.

## Commandes utiles

- `npm run dev` — serveur de développement (Vite)
- `npm run build` — build de production
- `npm run preview` — prévisualiser le build produit

## Ignore Git

Le projet contient un fichier `.gitignore` pour éviter d'ajouter `node_modules` et d'autres fichiers temporaires au dépôt.

## Comportement des contrôles

- Cliquer sur `F ↻` tourne la face avant d'un quart de tour horaire.
- Cliquer sur `F ↺` tourne la face avant d'un quart de tour anti‑horaire.
- `Scramble` effectue une série de rotations aléatoires.
- `Reset` replace les cubies dans leur position d'origine.

## Limitations et améliorations possibles

- Le rendu utilise `MeshBasicMaterial` (pas d'ombrage complexe).
- Améliorer la gestion des mouvements concurrents et ajouter undo/redo.
- Ajouter la vérification d'état résolu et un compteur de mouvements.
- Ajouter des raccourcis clavier pour les mouvements.

## Licence

Code fourni à titre d'exemple. Libre d'utilisation pour l'apprentissage.


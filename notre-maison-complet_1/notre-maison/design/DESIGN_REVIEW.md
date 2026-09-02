# DESIGN_REVIEW — Phase de validation intégrée (Priorités 1 + 2)

Aucune maquette n'a été produite avec un outil de design dédié : l'UI
suit les tokens déjà en place dans `src/styles/index.css` (couleurs,
rayons, ombres, typographie) pour rester visuellement cohérente avec le
reste de l'application ("Notre Maison"). Ce document couvre donc une
revue de cohérence de code/style, pas une revue graphique humaine.

## Cohérence visuelle
- PASS — Arbre et Album réutilisent les mêmes classes `.btn`, `.modal-*`,
  `.stack-form`, `InlineLoading/InlineError/EmptyState` que le reste de
  l'app (Membres, Contributions). Aucune classe dupliquée avec un style
  divergent.
- PASS — Palette et espacements identiques (variables CSS `--color-*`,
  `--radius-*`, `--shadow-*`), aucune couleur codée en dur ajoutée.

## Accessibilité
- PASS — labels associés aux champs, `alt` sur les photos, `aria-label`
  sur les boutons icône, fermeture des modales/lightbox au clavier
  (Échap), navigation clavier ←/→ dans la visionneuse.
- PARTIAL — le canvas de l'arbre (pan/zoom) n'a pas d'équivalent clavier
  pour se déplacer (seulement souris/tactile) ; la recherche et la
  sélection au clavier (Tab + Entrée) fonctionnent en revanche.

## Responsive (revue de code, pas de test sur appareil réel)
- Grilles albums/photos en `auto-fill` : se réorganisent nativement.
- Lightbox : bascule en une colonne sous 760px.
- Bouton "Définir comme couverture" : rendu toujours visible sous 760px
  (corrigé pendant la Priorité 2, pas seulement en `:hover`).
- NOT TESTED sur un vrai appareil (voir `PROJECT_STATUS.md`).

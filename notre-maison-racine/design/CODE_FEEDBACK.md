# CODE_FEEDBACK — Priorités 1, 2 & 6

## PRIORITÉ 1 — ARBRE
Implementation: PASS
Database: PASS
Security: PASS (testé réellement en SQL — voir PROJECT_STATUS.md)
Tests: NOT TESTED — navigateur interactif indisponible.

## PRIORITÉ 2 — ALBUM
Implementation: PASS
Database: PASS
Storage: PASS
Security: PASS (testé réellement en SQL)
Tests: NOT TESTED
Responsive: NOT TESTED

## PRIORITÉ 6 — NOTRE HISTOIRE

Implementation:
PASS

Database:
PASS

RLS:
PASS

Storage:
NOT APPLICABLE — aucune nouvelle donnée binaire : les photos associées
pointent vers des lignes déjà existantes de la table `photos` (même
bucket `family-media`, aucun nouveau chemin, aucune duplication).

Realtime:
PASS — ajouté car pertinent : plusieurs membres peuvent enrichir la
même histoire familiale en parallèle (comme l'arbre et l'album). Les 3
nouvelles tables ont été ajoutées à `supabase_realtime` **dès la
migration initiale** cette fois (leçon tirée du bug Realtime trouvé
pendant la validation Arbre+Album), vérifié par relecture de
`pg_publication_tables` immédiatement après la migration.

Responsive:
NOT TESTED — pas d'appareil réel disponible. Prévu en CSS : timeline en
colonne unique avec repère latéral sur desktop/tablette, vignette photo
masquée et repère resserré sous 640px pour ne pas surcharger l'écran.

Build:
PASS (`npm run build`, 135 modules, 0 erreur)

Tests:
NOT TESTED pour tout ce qui demande un clic réel. **PASS réel** pour :
- migration appliquée sans erreur
- RLS forcée sur les 3 tables (vérifié `pg_class.relforcerowsecurity`)
- test SQL réel (transaction annulée, compte MEMBER réel) :
  - création d'un évènement dans sa propre famille → autorisé
  - falsification de `family_id` → bloqué (`new row violates row-level
    security policy`)
- persistance : non vérifiable sans clic réel, mais repose sur le même
  mécanisme Supabase déjà validé pour l'arbre et l'album

## Choix d'architecture (respecte l'instruction "ne pas dupliquer")
- Aucune nouvelle table de personnes : `family_history_event_members`
  n'est qu'une table de liaison vers `family_members` existant, avec
  trigger vérifiant que la personne appartient bien à la famille de
  l'évènement.
- Aucune nouvelle table de photos ni nouveau bucket : les photos d'un
  évènement sont des liens vers des lignes déjà existantes de `photos`
  (elles doivent d'abord exister dans un album). Une même photo peut
  être associée à plusieurs évènements sans duplication du fichier.
- Réutilisation des fonctions de sécurité existantes
  (`current_family_id()`, `is_admin()`, `is_active_member()`) et du
  même schéma de permissions (modification/suppression réservées au
  créateur ou à un ADMIN) déjà validé pour les albums.
- Réutilisation des composants `MemberPhoto` (arbre) et `AlbumPhoto`
  (album), des classes CSS `.modal-*`, `.stack-form`, `.tag-*`,
  `.btn--*` déjà en place — aucun style dupliqué.

## TESTS MANUELS RESTANTS (Priorité 6)

1. Ouvrir `/history`, vérifier l'état vide
2. Ajouter un souvenir avec date précise, puis un autre avec année approximative
3. Vérifier le tri chronologique et la section "Dates inconnues" pour un souvenir sans date
4. Ouvrir le détail, associer une personne existante, vérifier le lien vers sa fiche dans l'arbre
5. Associer une photo déjà présente dans un album, vérifier qu'aucun nouvel upload n'est déclenché
6. Modifier, puis supprimer un souvenir en tant que non-créateur/non-admin → vérifier le refus
7. Tester la recherche texte
8. Ouvrir deux onglets, ajouter un souvenir dans l'un, vérifier l'apparition automatique dans l'autre (Realtime)
9. Vérifier le rendu sur mobile réel (timeline, modale de détail en pleine largeur)


## PRIORITÉ 7 — ANNIVERSAIRES / CALENDRIER

Implementation:
PASS

Database:
NOT APPLICABLE — aucune nouvelle table (voir `design/CALENDAR_DESIGN.md`).
Réutilise `family_members.birth_date` (calcul pur côté client) et
`family_history_events.event_date` (filtre sur les dates futures).

RLS:
NOT APPLICABLE — aucune nouvelle table, donc aucune nouvelle policy ;
les données affichées passent déjà par les policies RLS de
`family_members` et `family_history_events`, déjà testées.

Storage:
NOT APPLICABLE

Realtime:
PASS — réutilise les abonnements déjà existants
(`subscribeToTreeChanges`, `subscribeToHistoryChanges`), aucun nouveau
canal créé.

Responsive:
NOT TESTED — CSS prévu (deux colonnes → une colonne sous 860px), non
vérifié sur appareil réel.

Build:
PASS (137 modules, 0 erreur)

Tests:
NOT TESTED pour l'affichage réel. **PASS réel** pour la logique pure :
`computeUpcomingBirthdays` est une fonction sans effet de bord, donc
vérifiable par le raisonnement sur son code (pas de test unitaire
automatisé exécuté faute de suite de tests existante dans ce projet —
à signaler comme dette si vous en voulez un plus tard).

## TESTS MANUELS RESTANTS (Priorité 7)

1. Ouvrir `/calendar` avec au moins un membre dont l'anniversaire tombe
   aujourd'hui, cette semaine, ce mois → vérifier le bon regroupement
2. Vérifier qu'un membre marqué décédé n'apparaît jamais dans les
   anniversaires
3. Ajouter un évènement à date future dans Notre histoire → vérifier
   son apparition automatique dans "Évènements à venir"
4. Cliquer sur un anniversaire → vérifier l'arrivée sur la fiche du
   membre dans l'arbre
5. Cliquer sur un évènement → vérifier l'ouverture du détail, et que
   "Modifier" renvoie bien vers Notre histoire
6. Vérifier le responsive (deux colonnes → une colonne) sur mobile réel

---

# AUDIT — Priorités 3, 4, 5 (avant finitions)

Aucune reconstruction : vérification uniquement, sur le projet Supabase
réel `notre-maison` et le code déjà livré.

## PRIORITÉ 3 — MEMBRES / RELATIONS
Implementation: PASS (fiche membre, relations parent/conjoint/enfant, déduction des frères/sœurs — voir Priorité 1)
Database: PASS (`family_members`, `family_relationships` intactes, contraintes vérifiées)
Security: PASS
Régression: AUCUNE — build inchangé, aucun fichier de cette fonctionnalité modifié

## PRIORITÉ 4 — AUTH / RLS / SÉCURITÉ
Implementation: PASS
Database: PASS — **vérifié à nouveau réellement** : `SELECT relforcerowsecurity FROM pg_class` sur les 18 tables publiques → toutes forcées, y compris les tables financières préexistantes (`contributions`, `expenses`, `members`, etc.)
Security: PASS — **recherche explicite de `USING (true)` sur toutes les policies du schéma `public`** → aucun résultat, zéro policy permissive trouvée
Régression: AUCUNE

## PRIORITÉ 5 — REALTIME
Implementation: PASS
Database: PASS — 12 tables confirmées dans `pg_publication_tables` (`supabase_realtime`)
Code: PASS — 4 `channel()` créés côté frontend (arbre, albums, photos d'album, histoire), 4 `removeChannel()` correspondants, tous dans des `useEffect` avec cleanup ; aucune fuite d'abonnement détectée
Régression: AUCUNE

---

# PRIORITÉ 8 — FINITIONS

Implementation:
PASS

Design System:
PASS — aucune nouvelle couleur/rayon/ombre ajoutée ; navigation
regroupée en deux blocs visuels (fonctionnalités familiales / gestion
financière) séparés par un simple séparateur CSS, plus lisible
maintenant que la nav compte 10 liens.

Dashboard:
PASS — **travail retrouvé en cours et terminé** : une section "🌳 Notre
Maison" avec 4 cartes cliquables (membres de l'arbre + générations,
photos + albums, souvenirs, anniversaires ce mois-ci) avait été codée
dans `Dashboard.jsx` mais son CSS manquait encore (`.family-stats`,
`.family-stat-card` inexistants) — ajouté et vérifié par build. Erreurs
sur les nouvelles requêtes isolées du reste du tableau de bord : si les
tables Notre Maison ne répondent pas, les cotisations/dépenses restent
utilisables.

Performance:
PASS — un vrai point trouvé et corrigé : dans `TreeCanvas`, le calcul
des tracés SVG (liens parents/conjoints) n'était pas mémoïsé et se
refaisait à **chaque frame de pan/zoom** de la souris. Isolé dans un
`useMemo` dépendant uniquement de `edges`/`nodesById` (jamais de la
vue), donc recalculé seulement quand les données changent.

Accessibilité:
PASS (revue de code) — base déjà solide et retrouvée intacte :
`:focus-visible` global, `.sr-only`, `prefers-reduced-motion` respecté
globalement, `aria-expanded`/`aria-controls` sur le menu mobile,
labels sur tous les champs de formulaire. NOT TESTED avec un lecteur
d'écran réel.

Animations:
PASS — apparition légère (fondu + léger déplacement) sur les modales,
la lightbox et les cartes (`history-card`, `album-card`, `tree-node`),
implémentée en CSS pur, automatiquement désactivée par la règle
`prefers-reduced-motion` déjà en place (aucune duplication de logique).

États loading/empty/error/success:
PARTIAL — loading/empty/error audités et cohérents sur toutes les
pages (composants partagés `InlineLoading`/`InlineError`/`EmptyState`
utilisés partout, y compris les 5 nouvelles pages). "Success" reste
**implicite** (fermeture de la modale + apparition immédiate de
l'élément dans la liste) plutôt qu'un système de notifications
("toast") dédié — décision volontaire pour ne pas ajouter un nouveau
composant d'architecture globale sur une session de finitions ; à
reconsidérer si vous le souhaitez explicitement.

Responsive:
NOT TESTED — aucun appareil réel disponible. Revue de code seulement :
nav mobile déjà fonctionnelle (menu hamburger existant, non reconstruit),
grilles en `auto-fill`/`auto-fit` partout, timeline et lightbox
prévues pour l'empilement sous 640-860px selon les pages.

Build:
PASS (`npm run build`, 137 modules, 0 erreur)

Tests:
NOT TESTED pour tout ce qui nécessite un navigateur réel. PASS réel
pour : build, RLS forcée (re-vérifiée), absence de policy permissive,
équilibre channel/removeChannel.

## Contrôle des changements (Priorité 8)
- `git diff` sur les fichiers partagés : uniquement des ajouts, sauf
  `Dashboard.jsx` où le contenu déjà présent (non écrit dans cette
  session) a été complété, jamais réduit.
- Recherche de secrets / `service_role` / clés privées : rien trouvé.
- Aucun `.env` commité.
- Aucune table, policy ou fichier supprimé.

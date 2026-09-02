# PROJECT_STATUS — Notre Maison, Espace familial

Dernière mise à jour : Audit P3-P4-P5 + Priorité 8 (Finitions) terminés.

## Dépôt et projets réels (reconfirmés à chaque session)
- Dépôt : `KINGPIC6/cotisation-familiale-`, racine du dépôt = version
  déployée sur Vercel. `notre-maison_3/` et `env/notre-maison/` sont des
  copies non utilisées — vérifiées intactes (`git status` ne montre
  aucun changement dessus).
- Vercel : toujours bloqué en écriture depuis cet environnement
  (`Vercel:list_projects` renvoie une erreur) — le code doit être
  intégré manuellement par git push.
- Supabase : projet `notre-maison` (ref `etxxyidhizniewmmfgtw`),
  `ACTIVE_HEALTHY`. Une seule vraie famille existe à ce jour dans ce
  projet ("FAMILLE CISSE", 1 ADMIN + 1 MEMBER, 0 membre d'arbre, 0 album)
  — donnée réelle, non touchée par les tests ci-dessous.

## Priorité 1 — Arbre généalogique : TERMINÉ, validé

- Schéma, RLS, Storage : PASS
- Sécurité : **testée réellement** au niveau base de données (voir
  "Tests de sécurité" ci-dessous), pas seulement lue sur le papier
- Frontend : build PASS, jamais cliqué dans un navigateur réel

## Priorité 2 — Album photo : TERMINÉ, validé

- Schéma, RLS, Storage : PASS
- Sécurité : testée réellement (même méthode)
- Frontend : build PASS, jamais cliqué dans un navigateur réel
- **Bug trouvé et corrigé pendant cette phase** : Realtime était
  silencieusement inactif sur les 6 nouvelles tables (non ajoutées à la
  publication `supabase_realtime`) ; corrigé.
- **Gap trouvé et corrigé** : aucun lien depuis une personne taguée sur
  une photo vers sa fiche dans l'arbre ; corrigé (`/tree?focus=<id>`).

## Tests de sécurité — méthode et résultat

Sans navigateur interactif, un test RLS *réel* a été exécuté directement
en base (pas une relecture de policy) : ouverture d'une transaction,
`SET LOCAL ROLE authenticated` + `SET LOCAL request.jwt.claims` avec
l'identifiant du vrai compte MEMBER existant, puis tentatives réelles
d'INSERT/DELETE, transaction annulée (`ROLLBACK`) à la fin — aucune
donnée réelle modifiée.

Résultats :
1. MEMBER crée un membre de sa propre famille → **autorisé** (attendu)
2. MEMBER tente de supprimer ce membre (réservé ADMIN) → **bloqué** (attendu)
3. MEMBER tente d'insérer avec un `family_id` falsifié → **bloqué**,
   erreur Postgres `new row violates row-level security policy` (attendu)
4. ADMIN supprime le même membre → **autorisé** (attendu)
5. MEMBER tente d'écrire un chemin Storage `family/{autre-uuid}/...` →
   **bloqué**, même erreur RLS (attendu)

Isolation famille A vs famille B (deux comptes réels dans deux familles
différentes) : **IMPOSSIBLE À TESTER** dans cet environnement — un seul
vrai compte/famille existe dans ce projet Supabase, et créer une
deuxième famille de test nécessiterait soit un vrai flux d'inscription
(indisponible ici), soit fabriquer directement une ligne `auth.users`
par SQL — délibérément évité pour ne pas risquer de corrompre le
système d'authentification réel ou laisser un compte fantôme. La
logique RLS (`family_id = current_family_id()`) est strictement la même
que celle testée en (3) et (5) ci-dessus, donc à haute confiance, mais
ce n'est pas un test à deux comptes réel.

## Priorité 6 — Notre histoire : TERMINÉ, validé au même niveau que P1/P2

- Tables `family_history_events`, `family_history_event_members` (lien
  vers `family_members`, aucune table de personnes créée),
  `family_history_event_photos` (lien vers `photos`, aucun nouveau
  bucket, aucune photo dupliquée).
- RLS forcée + testée réellement en SQL (même méthode que P1/P2) :
  création par un MEMBER dans sa propre famille autorisée,
  falsification de `family_id` bloquée.
- Realtime ajouté **dès la migration** cette fois (le bug de la phase
  précédente — tables oubliées dans la publication — ne s'est pas
  reproduit ; vérifié immédiatement après la migration).
- Page `/history` : timeline chronologique (dates précises et années
  approximatives mélangées puis triées), section séparée pour les
  souvenirs sans date, recherche texte, création/édition/suppression
  selon permissions, vue détaillée avec personnes concernées et photos
  associées.
- Build : PASS. Aucune fonctionnalité existante modifiée ou supprimée
  (`git diff` ne montre que des ajouts sur les 3 fichiers partagés).

## Priorité 7 — Anniversaires / Calendrier : TERMINÉ

- Aucune nouvelle table (décision documentée dans
  `design/CALENDAR_DESIGN.md`) : anniversaires calculés depuis
  `family_members.birth_date`, évènements à venir filtrés depuis
  `family_history_events.event_date`.
- Page `/calendar` : anniversaires groupés aujourd'hui/semaine/mois,
  évènements à venir triés chronologiquement, lien vers la fiche membre
  et vers le détail d'évènement (composants réutilisés).
- Build PASS (137 modules). `git diff` : uniquement des ajouts sur les
  3 fichiers partagés (App.jsx, AppShell.jsx, styles/index.css).

## Audit des Priorités 3, 4, 5 (aucune reconstruction)

- Membres/relations : PASS, aucune régression.
- Auth/RLS/sécurité : PASS — RLS forcée re-vérifiée sur les 18 tables
  publiques (financières + Notre Maison), zéro policy `USING (true)`
  trouvée sur l'ensemble du schéma.
- Realtime : PASS — 12 tables dans la publication, 4 canaux créés côté
  frontend pour 4 `removeChannel` (aucune fuite).

## Priorité 8 — Finitions : TERMINÉ

- Navigation regroupée (famille / gestion financière) pour rester
  lisible avec désormais 10 liens.
- Dashboard : section "Notre Maison" (stats arbre/album/histoire/
  anniversaires) retrouvée codée mais sans CSS — complétée.
- Performance : mémoïsation des tracés SVG de l'arbre (recalculés à
  chaque frame de pan/zoom auparavant).
- Animations légères d'apparition (modales, cartes), respectant
  `prefers-reduced-motion` déjà en place.
- Accessibilité : base déjà solide confirmée intacte (focus visible,
  sr-only, aria sur le menu mobile).
- Build PASS (137 modules). Aucune donnée, table, policy ou
  fonctionnalité supprimée.

## Priorités restantes

Aucune priorité fonctionnelle majeure ne reste non abordée dans la liste des 8. Les seuls éléments non résolus sont les tests nécessitant un navigateur/appareil réel (voir ci-dessous).

## Limitations connues
- Aucun test de clic réel dans un navigateur (pas de session
  interactive disponible ici).
- Isolation inter-familles testée par logique de policy identique,
  pas par deux comptes réels (voir ci-dessus).
- Accès Vercel/GitHub toujours en lecture seule depuis cet environnement.

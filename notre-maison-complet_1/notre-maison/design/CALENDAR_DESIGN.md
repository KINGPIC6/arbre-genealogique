# Décision Design — Priorité 7 : Anniversaires / Calendrier

## Choix : pas de nouvelle table, pas de vue "mois" en grille

Le cahier des charges rend le calendrier optionnel ("Prévoir
éventuellement") et le §31 avertit contre les tables redondantes.
Décision : `/calendar` est une vue de synthèse qui **recombine des
données déjà réelles**, sans nouvelle table :

1. **Anniversaires** — calculés à la volée depuis
   `family_members.birth_date` (aucune date stockée séparément, aucun
   anniversaire "inventé" pour un membre décédé — `death_date` exclut le
   membre du calcul).
2. **Évènements à venir** — les entrées de `family_history_events` dont
   `event_date` est une date exacte future. Une réunion de famille
   planifiée, un mariage à venir, etc. se saisissent normalement dans
   *Notre histoire* ; s'ils ont une date future, ils apparaissent
   automatiquement ici. Pas de duplication, pas de synchronisation à
   maintenir.

Une vue "grille mensuelle" façon Google Calendar a été volontairement
écartée pour cette itération : elle n'apporte pas de valeur
supplémentaire pour l'usage réel visé (voir peu d'anniversaires/
évènements à la fois) et aurait ajouté une complexité d'implémentation
et de test disproportionnée. Une liste groupée
(aujourd'hui/semaine/mois pour les anniversaires, liste chronologique
pour les évènements) est plus lisible sur mobile et plus rapide à
vérifier. À reconsidérer si le volume de données grandit.

## Cohérence
Réutilise `MemberPhoto` (arbre), `EventDetailModal` (histoire), le lien
`/tree?focus=<id>` déjà en place, et les mêmes classes `.btn`,
`InlineLoading/InlineError/EmptyState`.

## Responsive
Deux colonnes (anniversaires / évènements) sur desktop et tablette,
une seule colonne empilée sous 860px.

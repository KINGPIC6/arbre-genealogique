/**
 * Calcule, à partir des dates de naissance réellement enregistrées dans
 * family_members, les prochains anniversaires et les regroupe en
 * "aujourd'hui / cette semaine / ce mois" (§25 du cahier des charges).
 * Fonction pure, aucune donnée inventée : un membre sans birth_date est
 * simplement ignoré.
 */
export function computeUpcomingBirthdays(members, referenceDate = new Date()) {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  const withNextOccurrence = members
    .filter((m) => !!m.birth_date && !m.death_date)
    .map((m) => {
      const birth = new Date(m.birth_date);
      let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      if (next < today) next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
      const daysUntil = Math.round((next - today) / (1000 * 60 * 60 * 24));
      const turningAge = next.getFullYear() - birth.getFullYear();
      return { member: m, nextOccurrence: next, daysUntil, turningAge };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    today: withNextOccurrence.filter((b) => b.daysUntil === 0),
    thisWeek: withNextOccurrence.filter((b) => b.daysUntil >= 1 && b.daysUntil <= 7),
    thisMonth: withNextOccurrence.filter((b) => b.daysUntil >= 8 && b.daysUntil <= 31),
  };
}

---
description: Chiude un lavoro - controlli, revisione, branch claude/, commit e PR
argument-hint: [breve descrizione del lavoro]
---
Chiudi il lavoro "$ARGUMENTS" seguendo questi passi, fermandoti al primo problema:

1. Se sei su `main`, crea un branch `claude/<nome-breve-in-italiano>`.
2. Esegui `npm run build` (include il controllo dei tipi). Correggi gli errori.
3. Lancia il subagente **guardiano-trimmer** sul diff. Se l'esito e' DA CORREGGERE, correggi e rilancialo.
4. Aggiorna la documentazione di stato (CLAUDE.md, LEGGIMI.txt e nota nel vault) se il lavoro cambia cosa e' fatto o cosa resta.
5. Commit in italiano, poi push del branch e `gh pr create` con descrizione in italiano: cosa cambia, come e' stato verificato, cosa resta a Claudio.
6. Non fare merge su `main` e non promuovere in produzione: quello lo decide Claudio.

Alla fine scrivi solo: link della PR, esito dei controlli, eventuali azioni manuali per Claudio.

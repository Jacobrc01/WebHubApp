# WebHubApp
Web Hub Application for managing events and messages online in a closed forum

------------------------

#### Danish notes under here:

## 1. Hvad skal vi bygge?

- En webapplikation hvor
1. Tutorer kan poste begivenheder og opdateringer til nye studerende
2. Nye studerende kan se event-feed og tilmelde sig
3. Det føles som en simpel app, men virker i browseren

## 2. Hvilke teknologier bruger vi og hvorfor?

| Værktøj          | Hvad det gør                         | Hvorfor det er godt                                         |
| ---------------- | ------------------------------------ | ----------------------------------------------------------- |
| **Next.js**      | Bygger selve hjemmesiden (med React) | Gør det nemt at lave både sider og API’er ét sted           |
| **Tailwind CSS** | Styling af knapper, layouts osv.     | Hurtigt og fleksibelt – ingen .css-filer at rode med        |
| **Supabase**     | Login + database i skyen             | Du slipper for at lave backend fra bunden – det virker bare |
| **Vercel**       | Gratis hosting af din webapp         | Super nemt at bruge sammen med Next.js                      |


## 3. Det første mål - Få et Next.js + Tailwind projekt live
Lad os starte med at få en Next.js + Tailwind hjemmeside kørende online på Vercel, så du ser det hele virker. 



# User Stories:

## For studerende:

1. Som studerende vil jeg kunne se en oversigt over kommende events, så jeg ved hvad der sker under introforløbet.

2. Som studerende vil jeg kunne tilmelde mig et event, så tutorerne har en formodning om hvem der kommer.

3. Som studerende vil jeg kunne læse mere om et event, fx hvad det handler om, hvor og hvornår.

4. Som studerende vil jeg kunne se opdateringer eller ændringer til events, så jeg ikke går glip af vigtig info.

## For Tutorer:

5. Som tutor vil jeg kunne oprette nye events med titel, beskrivelse, tidspunkt og sted, så de studerende kan få besked om nye aktiviteter.

6. Som tutor vil jeg kunne redigere eller slette events, hvis planerne ændrer sig.

7. Som tutor vil jeg kunne se hvem der har tilmeldt sig et event, så jeg kan planlægge bedre.

8. Som tutor vil jeg kunne sende en besked til alle tilmeldte til et event, fx hvis tidspunkt ændres.

#### De er nok til at planlægge den første version (MVP). 
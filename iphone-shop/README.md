# Boutique iPhone — Next.js + Supabase + Vercel

Vitrine de smartphones avec pages produit (couleurs, stockages, prix dynamiques, vue 3D Three.js) et panel d'administration protégé. Toutes les données sont dans Supabase (PostgreSQL) et partagées entre tous les visiteurs.

## Ce qui est implémenté

- Vitrine avec 4 produits de démonstration (iPhone 18, 18 Pro, 17, 17 Pro), pages `/<slug>`, 404 propre.
- Nom du site, slogan, textes, boutons, couleurs, rayon, animations, navigation et pied de page : lus en base, modifiables dans `/admin/site`.
- Couleurs et stockages indépendants par produit (ajout, modification, suppression, activation, ordre, valeur par défaut).
- Prix en centimes entiers, formatés en français, validés côté serveur (négatifs refusés).
- Bouton Acheter : lien par combinaison couleur+stockage > stockage > couleur > produit, HTTPS uniquement. La résolution finale se fait côté serveur (`/go/<slug>`), qui refuse toute variante désactivée ou manipulée.
- Vue 3D (GLB/glTF) chargée à la demande : rotation souris/tactile, zoom optionnel, rotation automatique, réinitialisation. Sans modèle, sans WebGL ou en cas d'échec : image de remplacement.
- `/?admin` redirige vers `/admin` (raccourci, pas une autorisation). Chaque page et chaque action admin vérifie côté serveur la session Supabase **et** la présence dans `admin_users`.
- RLS activée sur toutes les tables : le public ne lit que les produits publiés et les variantes actives, et ne peut rien écrire.
- Cache : les pages sont statiques, et chaque enregistrement admin appelle `revalidatePath('/', 'layout')`. Les onglets déjà ouverts se rafraîchissent toutes les 60 s (pas de Realtime).

## Limites actuelles (à connaître)

- **Pas d'upload de fichiers** : vous saisissez des URL HTTPS. Un bucket public `media` est créé ; déposez-y images et GLB via le tableau de bord Supabase (Storage), puis collez l'URL publique.
- **Pas de modèles 3D fournis** : aucun fichier GLB officiel n'est inclus. Sans fichier, l'image de remplacement est utilisée.
- **Réinitialisation du mot de passe par e-mail non implémentée** : utilisez Supabase > Authentication > Users (« Send password recovery »), ou relancez `npm run create-admin` avec un nouveau mot de passe. Le changement de mot de passe connecté est disponible dans `/admin/security`.
- **Limitation des tentatives de connexion** : assurée par les limites intégrées de Supabase Auth (Authentication > Rate Limits), pas par un compteur propre au projet.
- Les sections du panel sont regroupées : Vue d'ensemble, Produits (avec couleurs, stockages, 3D et liens), Personnalisation, Sécurité.
- Ce code a été écrit sans accès réseau : **`npm install`, la compilation et les tests n'ont pas été exécutés**. Lancez les commandes ci-dessous et corrigez les éventuelles erreurs de typage.

## Installation locale

```bash
npm install
cp .env.example .env.local   # puis remplir les 3 variables
npm run typecheck
npm test                      # tests unitaires ; l'intégration RLS s'active si les variables Supabase sont définies
npm run dev
```

## Supabase

1. Créez un projet sur supabase.com.
2. SQL Editor : collez et exécutez `supabase/migrations/0001_init.sql` **une seule fois** (tables, RLS, bucket `media`, données de démonstration).
3. Project Settings > API : copiez l'URL, la clé `anon` et la clé `service_role` dans `.env.local`.
4. Créez l'administrateur (le mot de passe n'est stocké nulle part dans le projet) :

```bash
ADMIN_EMAIL=vous@exemple.fr ADMIN_PASSWORD='un-mot-de-passe-long-12+' npm run create-admin
```

5. Authentication > Providers > Email : désactivez « Allow new users to sign up » pour empêcher toute inscription publique.

Ouvrez ensuite `http://localhost:3000/?admin`.

## Déploiement Vercel

1. Poussez le projet sur GitHub (`.env.local` est ignoré par git).
2. Vercel > Add New Project > importez le dépôt (Next.js détecté automatiquement).
3. Environment Variables : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (cette dernière sans préfixe `NEXT_PUBLIC_`).
4. Déployez, puis vérifiez : les 4 pages produit, `/?admin` (écran de connexion), une modification de prix visible depuis un autre navigateur, et la persistance après un redéploiement.

Les redéploiements ne touchent pas à la base : vos prix et réglages restent intacts.

## Créer ou réinitialiser l'administrateur depuis Vercel

1. Vercel > Settings > Environment Variables : ajoutez `ADMIN_EMAIL` et `ADMIN_PASSWORD` (12 caractères minimum).
2. Redéployez le projet.
3. Ouvrez `/admin/setup` et cliquez sur « Créer / réinitialiser le compte ».
4. Connectez-vous sur `/admin/login`, puis **supprimez les deux variables** et redéployez : la page se désactive.

## Ajouter un modèle 3D

1. Exportez un fichier `.glb` (idéalement < 5 Mo, textures compressées).
2. Supabase > Storage > `media` > envoyez le fichier, copiez son URL publique.
3. Admin > Produits > Modifier > « Modèle 3D » : collez l'URL, enregistrez. Un modèle spécifique par couleur est possible dans la section Couleurs.

## Structure

```
supabase/migrations/0001_init.sql   schéma, index, RLS, seed idempotent
scripts/create-admin.ts             création du premier administrateur
src/lib/                            prix, validation (zod), accès données, auth
src/app/                            vitrine, pages produit, /go/[slug], /admin
src/components/                     Nav, Footer, Configurator, PhoneViewer (Three.js), formulaires admin
tests/                              tests unitaires et test d'intégration RLS
```

## Zoom sur les photos

Admin > Produits > Modifier : « Zoom sur les photos » (clic pour agrandir, le pointeur déplace la zone vue) et « Niveau de zoom » (1,5 à 5). Exécutez d'abord `supabase/migrations/0004_image_zoom.sql` une seule fois dans le SQL Editor, sinon l'enregistrement d'un produit échouera (colonnes manquantes).

## Illustrations (admin > Illustrations)

Comme l'image en haut de l'accueil, vous pouvez ajouter autant d'illustrations que vous voulez, où vous voulez, depuis l'admin :
envoi du fichier, **page** (accueil, une page produit ou une page catégorie), **emplacement** (haut, milieu sur l'accueil, bas), **taille** (grande, moyenne, petite),
légende, ordre, et case « Visible sur le site ». Plusieurs illustrations au même endroit s'empilent dans l'ordre choisi.
Exécutez d'abord `supabase/migrations/0008_illustrations.sql` une seule fois (elle reprend l'image actuelle de l'accueil comme première illustration, que vous pouvez alors changer ou supprimer).
Tant qu'elle n'est pas passée, le site garde l'image historique et la page admin le signale.
Restent fixes dans le code : la tuile « Chaque détail compte » (`src/app/page.tsx`) et l'image de la page « Page introuvable ».

## Finitions d'interface

Ajoutées dans `src/app/globals.css` (section « Finitions façon Apple ») et `src/components/Polish.tsx` :
filet de lumière sur les arêtes des cartes et visuels, ombres en couches, halo qui suit le curseur, scène produit éclairée, coloris à reflet métal,
boutons avec reflet, titre d'accueil en dégradé, apparition douce au défilement, barre de navigation qui s'affirme au défilement.
Tout le mouvement est coupé si « animations » est désactivé dans l'administration ou si le visiteur préfère moins de mouvement.

## Catégories du menu (façon Apple)

Admin > **Catégories du menu** : créez une catégorie (ex. « iPhone », « Accessoires »), cochez les articles à y afficher, réglez leur ordre, puis cochez « Publiée ».
Elle apparaît dans la barre du haut et ouvre la page `/categorie/<slug>` qui n'affiche que les articles choisis (seuls les produits publiés sont visibles).
Exécutez d'abord `supabase/migrations/0005_categories.sql` une seule fois dans le SQL Editor. Tant qu'elle n'est pas passée, le site fonctionne normalement, sans catégories.

## Image de l'accueil et galerie de la page produit

Admin > Produits > Modifier :
- **Ce que montre la carte de l'écran d'accueil** : « Le modèle 3D » ou « Une photo ». **Photo de la carte** : l'image utilisée (et affichée pendant le chargement du modèle).
- **Photos de la page produit** : ajoutez, ordonnez et supprimez les photos. Sur la page de l'article, le visiteur voit le modèle 3D puis ces photos via des miniatures (la vignette « 3D » ramène au modèle).
Exécutez d'abord `supabase/migrations/0006_card_and_gallery.sql` une seule fois, avant de déployer cette version (sinon les pages produit ne se chargent pas).

## Galerie par couleur et flèches

Chaque photo de la page produit peut être liée à une couleur (« Toutes les couleurs » par défaut). Le visiteur passe du modèle 3D aux photos avec les flèches (ou les touches ← →) et les miniatures ; quand il change de couleur, la galerie se met à jour et repart du modèle 3D. Exécutez `supabase/migrations/0007_gallery_by_color.sql` une seule fois, après 0006.

## Ordre des produits et accueil

- **Admin > Produits de l'accueil** : afficher ou cacher chaque produit sur l'accueil (bouton), et le monter/descendre avec ▲ ▼ (enregistré tout de suite).
- **Admin > Catégories du menu > (une catégorie)** : section « Ordre d'affichage dans cette catégorie » avec ▲ ▼. L'ordre est propre à chaque catégorie : un même produit peut être premier dans l'une et dernier dans une autre. Les articles cochés sont ajoutés à la fin.
Aucune migration nécessaire.

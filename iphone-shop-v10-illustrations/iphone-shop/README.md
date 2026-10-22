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

## Illustrations

Les visuels sont dans `public/images/` (`iphone-couleurs.jpg`, `iphone-camera.jpg`, `iphone-violet.webp`). Ils sont utilisés à trois endroits seulement :
bandeau des coloris sous le titre de l'accueil, tuile « Chaque détail compte » sous la liste des produits, et page « Page introuvable ».
Pour changer un visuel, remplacez le fichier en gardant son nom ; les textes de la tuile sont dans `src/app/page.tsx`.

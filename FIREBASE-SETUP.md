# Personal GitHub and Firebase setup

This project is isolated from `Dhruvith-codesync`. Git uses a repository-local author and a dedicated SSH key. Firebase uses only the personal project `personalportfolio-e5033`.

## Release order

1. Authenticate the personal GitHub key.
2. Register the Firebase web app and enable Authentication and Firestore.
3. Put Firebase's public web configuration in ignored `.env.local`.
4. Authenticate the project-local Firebase CLI with the personal Google account.
5. Build and test the public site and Content Studio locally.
6. Review the exact Git files, commit them, and push the source to GitHub.
7. Deploy Firestore rules before saving cloud content.
8. Sign in to the Content Studio and make the first save to seed `portfolio/public`.
9. Deploy the tested public build to Firebase Hosting.
10. Add the separate admin Hosting site after its globally unique site ID is confirmed.

`git push` sends source code to GitHub. `firebase deploy` sends a built website or Firebase rules to Firebase. They are separate operations.

## 1. Authenticate only the personal GitHub repository

The dedicated public key is stored at:

```text
C:\Users\DELL\.ssh\id_ed25519_dhruvith_portfolio.pub
```

While signed into the personal `Dhruvith` account, open **GitHub → Settings → SSH and GPG keys → New SSH key**. Name it `Dhruvith portfolio — DELL`, paste the full single line from that `.pub` file, and save it. Never paste the private file without `.pub` anywhere.

Verify from this project folder:

```powershell
ssh -i C:\Users\DELL\.ssh\id_ed25519_dhruvith_portfolio -o IdentitiesOnly=yes -T git@github.com
git ls-remote origin
```

The SSH greeting must name `Dhruvith`, not `Dhruvith-codesync`.

## 2. Register the Firebase web app

Open the personal Firebase project, then go to **Project settings → General → Your apps → Web (`</>`)**.

- App nickname: `Dhruvith Portfolio Web`
- Do not enable Google Analytics unless there is a concrete measurement plan.
- Copy the `firebaseConfig` values shown after registration.

Create `.env.local` from `.env.example` and replace every `replace_me` value. Do not commit `.env.local`.

## 3. Enable only the services used now

### Authentication

Go to **Build → Authentication → Get started → Sign-in method → Google**. Enable Google, select the personal support email, and save. The cloud editor still rejects every account except the exact verified owner email in `firestore.rules`.

### Cloud Firestore

Go to **Build → Firestore Database → Create database**.

- Choose **Standard edition / Native mode**.
- Choose **Production mode**.
- For a Hyderabad-focused personal site, choose `asia-south1 (Mumbai)` if the project location is not already fixed.

The Firestore location cannot be changed after provisioning. The checked-in rules expose only `portfolio/public` for reads and allow owner-only create/update operations.

### Storage

Skip Storage for now. The current local songs must not be uploaded. Firebase Storage requires the Blaze pay-as-you-go plan; if it is added later, attach a billing budget alert first.

## 4. Authenticate the Firebase CLI without using another account

From the project folder:

```powershell
pnpm run firebase:login
pnpm exec firebase login:list
pnpm exec firebase login:use YOUR_PERSONAL_GOOGLE_EMAIL
pnpm exec firebase projects:list
pnpm exec firebase use personalportfolio-e5033
```

In the browser window opened by Firebase, select the personal Google account that owns `personalportfolio-e5033`. `projects:list` must show that exact project before any deploy.

## 5. Verify locally

```powershell
pnpm run build
pnpm run test:sites
pnpm run cms:admin -- --host 127.0.0.1
```

For a cloud-editor test on localhost, keep `VITE_CMS_BACKEND=firebase` in `.env.local`, open the admin preview, sign in with the owner Google account, and verify that an unauthorized Google account is rejected.

## 6. GitHub first push

Review the staged file list and diff before creating the first commit. Do not include `.env.local`, local MP3s, Firebase sessions, logs, build output, or QA captures.

After the authorized commit is ready, push the local setup branch to the empty repository's `main` branch:

```powershell
git push --set-upstream origin setup/firebase-personal:main
```

The target is only `git@github.com:Dhruvith/Portfolio_Latest.git`.

## 7. Firebase deployment order

Deploy rules first:

```powershell
pnpm run firebase:deploy:rules
```

Build again using the production `.env.local`, then deploy Hosting:

```powershell
pnpm run build
pnpm run firebase:deploy:hosting
```

The initial public URL will be `https://personalportfolio-e5033.web.app` unless the project has a different default Hosting site. Add a custom public domain only after this URL is verified.

## 8. Separate admin domain

Create a second Firebase Hosting site only after the public site works:

```powershell
pnpm exec firebase hosting:sites:create dhruvith-portfolio-admin --project personalportfolio-e5033
pnpm exec firebase target:apply hosting admin dhruvith-portfolio-admin
```

The site ID is globally unique, so the CLI may require a different available name. After the exact ID is known, add it as a second Hosting target pointing to `dist/admin`, build with `pnpm run cms:build`, and deploy only that target. Add its `web.app` URL or custom admin domain under **Authentication → Settings → Authorized domains**.

Do not automate GitHub-to-Firebase deployments until one manual rules deployment and one manual Hosting deployment have both been verified.

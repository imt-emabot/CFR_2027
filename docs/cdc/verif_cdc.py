#!/usr/bin/env python3
"""
verif_cdc.py — vérificateur de cohérence des cahiers des charges.

Ne génère rien et ne modifie aucun document : il lit les .md tels qu'ils sont écrits,
plus le registre cdc.yaml, et signale les incohérences.

Usage :
    python3 verif_cdc.py                 # vérifie tout
    python3 verif_cdc.py --empreintes    # recalcule et réécrit les empreintes de liens
    python3 verif_cdc.py --matrice       # écrit matrice-tracabilite.md

Code de retour : 0 si aucune erreur, 1 sinon. Les avertissements ne font pas échouer.
"""

import argparse
import hashlib
import re
import sys
import unicodedata
from pathlib import Path

import yaml

RACINE = Path(__file__).resolve().parent
REGISTRE = RACINE / "cdc.yaml"

erreurs = []
avertissements = []


def err(code, msg):
    erreurs.append(f"[{code}] {msg}")


def avt(code, msg):
    avertissements.append(f"[{code}] {msg}")


# --------------------------------------------------------------------------
# Lecture
# --------------------------------------------------------------------------

def normaliser(txt):
    """Normalise un énoncé pour que l'empreinte ne bouge pas sur une reformulation
    d'espaces ou de ponctuation typographique."""
    txt = unicodedata.normalize("NFC", txt)
    txt = txt.replace("\u2019", "'").replace("\u00a0", " ")
    txt = re.sub(r"[*_`]", "", txt)
    txt = re.sub(r"\s+", " ", txt)
    return txt.strip().lower()


def empreinte(txt):
    return hashlib.sha1(normaliser(txt).encode("utf-8")).hexdigest()[:8]


def cellules(ligne):
    if not ligne.strip().startswith("|"):
        return None
    parts = [c.strip() for c in ligne.strip().strip("|").split("|")]
    return parts if len(parts) >= 2 else None


def lire_document(doc):
    """Retourne (texte, exigences, essais).

    exigences : {id: {"enonce":…, "origine":…, "verif":set, "ligne":n}}
    essais    : {id_essai: {"couvre": set(ids), "ligne": n}}
    """
    chemin = RACINE / doc["fichier"]
    texte = chemin.read_text(encoding="utf-8")
    pref = doc["id"]
    cats = "|".join(doc["categories"])
    re_exig = re.compile(rf"^{pref}-({cats})-(\d{{2}})$")
    re_essai = re.compile(rf"^{doc['essais_prefixe']}\d+[a-z]?$")
    re_id_global = re.compile(r"\b([A-Z]{3})-([A-Z]{2,3})-(\d{2})\b")

    exigences, essais = {}, {}
    for n, ligne in enumerate(texte.splitlines(), 1):
        cs = cellules(ligne)
        if not cs:
            continue
        tete = cs[0].strip()
        tete_nue = tete.strip("~ ").strip()
        if re_exig.match(tete_nue):
            retiree_inline = tete.startswith("~~")
            exigences[tete_nue] = {
                "enonce": cs[1],
                "origine": cs[2] if len(cs) >= 4 else "",
                "verif": set(re.findall(r"\b[IAEH]\b", cs[-1])),
                "ligne": n,
                "barree": retiree_inline,
            }
        elif re_essai.match(tete_nue):
            couvre = set()
            derniere = cs[-1]
            ids = re_id_global.findall(derniere)
            plats = [f"{a}-{b}-{c}" for a, b, c in ids]
            couvre.update(plats)
            # plages « X à Y »
            for m in re.finditer(
                r"([A-Z]{3})-([A-Z]{2,3})-(\d{2})\s+à\s+([A-Z]{3})-([A-Z]{2,3})-(\d{2})",
                derniere,
            ):
                p1, c1, n1, p2, c2, n2 = m.groups()
                if (p1, c1) == (p2, c2):
                    for k in range(int(n1), int(n2) + 1):
                        couvre.add(f"{p1}-{c1}-{k:02d}")
            essais[tete_nue] = {"couvre": couvre, "ligne": n}
    return texte, exigences, essais


# --------------------------------------------------------------------------
# Contrôles
# --------------------------------------------------------------------------

def c1_unicite(tous):
    vus = {}
    for doc_id, exigs in tous.items():
        for eid in exigs:
            if eid in vus:
                err("C1", f"{eid} défini deux fois : {vus[eid]} et {doc_id}")
            vus[eid] = doc_id


def c2_retires(tous, reg):
    retires = {r["id"]: r for r in reg.get("retires", [])}
    for doc_id, exigs in tous.items():
        for eid, e in exigs.items():
            if eid in retires and not e["barree"]:
                err("C2", f"{eid} est déclaré retiré ({retires[eid].get('motif','')}) "
                          f"mais figure comme exigence active dans {doc_id}, ligne {e['ligne']}")


def c3_trous(tous, reg):
    declares = {r["id"] for r in reg.get("retires", [])}
    for doc_id, exigs in tous.items():
        par_cat = {}
        for eid in exigs:
            pref, cat, num = eid.rsplit("-", 2)[0], eid.split("-")[1], int(eid.split("-")[2])
            par_cat.setdefault((pref, cat), []).append(num)
        for (pref, cat), nums in par_cat.items():
            for k in range(1, max(nums) + 1):
                cible = f"{pref}-{cat}-{k:02d}"
                if k not in nums and cible not in declares:
                    err("C3", f"trou de numérotation non déclaré : {cible} manque dans {doc_id}. "
                              f"Soit l'exigence est oubliée, soit il faut l'inscrire dans "
                              f"cdc.yaml:retires avec son motif")


def c4_references(docs, textes, tous):
    connus = {eid for exigs in tous.values() for eid in exigs}
    connus |= {r["id"] for r in REG.get("retires", [])}
    cats_toutes = set()
    for d in docs:
        cats_toutes.update(d["categories"])
    re_nu = re.compile(r"(?<![A-Z-])\b(" + "|".join(sorted(cats_toutes)) + r")-\d{2}\b")
    re_glob = re.compile(r"\b[A-Z]{3}-[A-Z]{2,3}-\d{2}\b")
    for d in docs:
        texte = textes[d["id"]]
        for n, ligne in enumerate(texte.splitlines(), 1):
            for m in re_nu.finditer(ligne):
                err("C4", f"{d['fichier']} ligne {n} : identifiant sans préfixe de document "
                          f"« {m.group(0)} ». Écrire le préfixe, par exemple {d['id']}-{m.group(0)}")
            for m in re_glob.finditer(ligne):
                if m.group(0) not in connus:
                    err("C4", f"{d['fichier']} ligne {n} : renvoi vers {m.group(0)}, "
                              f"qui n'existe dans aucun document")


def c5_couverture(docs, tous, essais_par_doc, reg):
    exempt = set(reg.get("couverture_exemptee", {}).keys())
    for d in docs:
        doc_id = d["id"]
        couverts = set()
        for e in essais_par_doc[doc_id].values():
            couverts |= e["couvre"]
        for eid, e in tous[doc_id].items():
            if e["barree"] or "E" not in e["verif"]:
                continue
            if eid not in couverts and eid not in exempt:
                err("C5", f"{eid} demande un essai (vérification E) mais n'est couverte "
                          f"par aucun essai du plan de vérification de {doc_id}")
        for essai, e in essais_par_doc[doc_id].items():
            for cible in e["couvre"]:
                if cible not in tous[doc_id] and cible not in exempt:
                    err("C5", f"l'essai {essai} de {doc_id} couvre {cible}, "
                              f"qui n'est pas une exigence de ce document")


def c6_origine(tous):
    for doc_id, exigs in tous.items():
        for eid, e in exigs.items():
            if e["barree"]:
                continue
            if e["origine"] and not re.search(r"[A-Z]", e["origine"]):
                avt("C6", f"{eid} : colonne d'origine vide ou illisible « {e['origine']} »")


def c7_constantes(docs, textes, reg):
    for nom, c in reg.get("constantes", {}).items():
        exceptions = c.get("exceptions", [])
        for interdit in c.get("interdits", []):
            for d in docs:
                for n, ligne in enumerate(textes[d["id"]].splitlines(), 1):
                    if interdit not in ligne:
                        continue
                    if any(x in ligne for x in exceptions):
                        continue  # mention historique explicitement autorisée
                    err("C7", f"{d['fichier']} ligne {n} : valeur périmée « {interdit} » "
                              f"pour la constante « {nom} ». Valeur en vigueur : "
                              f"{c['valeur']}")


def c8_versions(docs, textes):
    re_v = re.compile(r"(CDC|cahier des charges)[^.\n]{0,40}?\bv\d+[\.,]\d+", re.I)
    for d in docs:
        for n, ligne in enumerate(textes[d["id"]].splitlines(), 1):
            if n < 12:
                continue  # le frontmatter porte légitimement sa propre version
            m = re_v.search(ligne)
            if m:
                err("C8", f"{d['fichier']} ligne {n} : un autre document est cité par sa "
                          f"version « {m.group(0)} ». Citer un identifiant ou une section")


def c9_liens(tous, reg, reecrire=False):
    modifie = False
    for lien in reg.get("liens", []):
        cible = lien["vers"]
        source = lien["de"]
        doc_cible = cible.split("-")[0]
        if doc_cible not in tous or cible not in tous[doc_cible]:
            err("C9", f"lien {source} → {cible} : la cible n'existe pas")
            continue
        emp = empreinte(tous[doc_cible][cible]["enonce"])
        if lien.get("empreinte") != emp:
            if reecrire:
                lien["empreinte"] = emp
                lien["valide_le"] = REG["date_du_jour"]
                modifie = True
            else:
                err("C9", f"LIEN SUSPECT — {source} dérive de {cible}, dont l'énoncé a changé "
                          f"depuis la validation du {lien.get('valide_le','?')}. "
                          f"Relire {source}, puis revalider avec --empreintes")
    return modifie


# --------------------------------------------------------------------------
# Sorties
# --------------------------------------------------------------------------

def ecrire_matrice(docs, tous, essais_par_doc, reg):
    lignes = ["# Matrice de traçabilité", "",
              "*Généré par `verif_cdc.py --matrice`. Ne pas modifier à la main.*", ""]
    for d in docs:
        doc_id = d["id"]
        lignes += [f"## {doc_id} — {d['titre']}", "",
                   "| Exigence | Origine | Vérif. | Essais | Liens sortants | Liens entrants |",
                   "|---|---|---|---|---|---|"]
        sortants, entrants = {}, {}
        for l in reg.get("liens", []):
            sortants.setdefault(l["de"], []).append(l["vers"])
            entrants.setdefault(l["vers"], []).append(l["de"])
        for eid in sorted(tous[doc_id]):
            e = tous[doc_id][eid]
            es = sorted(k for k, v in essais_par_doc[doc_id].items() if eid in v["couvre"])
            lignes.append(
                f"| {eid} | {e['origine'] or '—'} | {''.join(sorted(e['verif'])) or '—'} | "
                f"{', '.join(es) or '—'} | {', '.join(sortants.get(eid, [])) or '—'} | "
                f"{', '.join(entrants.get(eid, [])) or '—'} |")
        lignes.append("")
    (RACINE / "matrice-tracabilite.md").write_text("\n".join(lignes), encoding="utf-8")
    print("matrice-tracabilite.md écrit")


def main():
    global REG
    ap = argparse.ArgumentParser()
    ap.add_argument("--empreintes", action="store_true",
                    help="revalide les liens suspects en réécrivant leurs empreintes")
    ap.add_argument("--matrice", action="store_true",
                    help="écrit matrice-tracabilite.md")
    args = ap.parse_args()

    REG = yaml.safe_load(REGISTRE.read_text(encoding="utf-8"))
    REG.setdefault("date_du_jour", "à compléter")
    docs = REG["documents"]

    textes, tous, essais_par_doc = {}, {}, {}
    for d in docs:
        t, ex, es = lire_document(d)
        textes[d["id"]], tous[d["id"]], essais_par_doc[d["id"]] = t, ex, es

    c1_unicite(tous)
    c2_retires(tous, REG)
    c3_trous(tous, REG)
    c4_references(docs, textes, tous)
    c5_couverture(docs, tous, essais_par_doc, REG)
    c6_origine(tous)
    c7_constantes(docs, textes, REG)
    c8_versions(docs, textes)
    modifie = c9_liens(tous, REG, reecrire=args.empreintes)

    if args.empreintes and modifie:
        REGISTRE.write_text(
            yaml.safe_dump(REG, allow_unicode=True, sort_keys=False, width=100),
            encoding="utf-8")
        print("cdc.yaml : empreintes de liens réécrites")

    if args.matrice:
        ecrire_matrice(docs, tous, essais_par_doc, REG)

    total = sum(len(v) for v in tous.values())
    print(f"\n{total} exigences lues dans {len(docs)} documents, "
          f"{len(REG.get('liens', []))} liens inter-documents.")
    for a in avertissements:
        print("  avertissement " + a)
    for e in erreurs:
        print("  ERREUR " + e)
    if erreurs:
        print(f"\n{len(erreurs)} erreur(s). Corriger avant de publier.")
        return 1
    print("\nAucune erreur.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

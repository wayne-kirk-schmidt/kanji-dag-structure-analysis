import json

def build_radical_dag():
    with open('../data/radicals_to_kanji.json', 'r', encoding='utf-8') as f_rad:
        radicals_kanji = json.load(f_rad)

    with open('../data/kanji_to_radicals.json', 'r', encoding='utf-8') as f_kan:
        kanji_radicals = json.load(f_kan)

    radical_dag = {}
    for radical, kanjis in radicals_kanji.items():
        radical_dag[radical] = {kanji: kanji_radicals[kanji] for kanji in kanjis}

    with open('../data/radical_dag.json', 'w', encoding='utf-8') as f:
        json.dump(radical_dag, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    build_radical_dag()

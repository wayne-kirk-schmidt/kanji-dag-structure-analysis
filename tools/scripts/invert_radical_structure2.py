import json

def invert_structure():
    with open('../data/kanji_to_radicals.json', 'r', encoding='utf-8') as f:
        kanji_radicals = json.load(f)

    radicals_kanji = {}
    for kanji, radicals in kanji_radicals.items():
        for radical in radicals:
            radicals_kanji.setdefault(radical, []).append(kanji)

    with open('../data/radicals_to_kanji.json', 'w', encoding='utf-8') as f:
        json.dump(radicals_kanji, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    invert_structure()

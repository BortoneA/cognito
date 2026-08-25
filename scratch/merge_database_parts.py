import json
import glob
import os
import sys

def merge_specific_parts(parts_folder="E:\\Nova pasta (2)", pattern="banco_questoes_parte_*_de_5.json"):
    """
    Merges only the specific 5 part files.
    """
    json_files = sorted(glob.glob(os.path.join(parts_folder, pattern)))
    if not json_files:
        print(f"No matching files '{pattern}' found in: {parts_folder}")
        return

    print(f"Found {len(json_files)} part files to merge:")
    for f in json_files:
        print(f" - {os.path.basename(f)} ({os.path.getsize(f)} bytes)")

    all_questions = []
    seen_ids = set()
    base_metadata = {}

    for file_path in json_files:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, dict):
            if not base_metadata:
                base_metadata["titulo"] = data.get("titulo", "Banco de questões — PNA 2018 a 2024 e Simulações APNA 2023 — Classificação clínica AMBOSS")
                base_metadata["versao"] = data.get("versao", "A")
                base_metadata["ano_da_prova"] = data.get("ano_da_prova", "2018–2024")
                base_metadata["classificacao_referencia"] = data.get("classificacao_referencia", "AMBOSS — PNA Matrix 2026")
            questoes = data.get("questoes", [])
        elif isinstance(data, list):
            questoes = data

        count_added = 0
        for q in questoes:
            qid = q.get("id")
            if qid:
                if qid in seen_ids:
                    print(f"Warning: Duplicate question ID '{qid}' found in {os.path.basename(file_path)}")
                else:
                    seen_ids.add(qid)
                    all_questions.append(q)
                    count_added += 1
            else:
                all_questions.append(q)
                count_added += 1

        print(f"Extracted {count_added} questions from {os.path.basename(file_path)}")

    result = {
        "titulo": base_metadata.get("titulo", "Banco de questões — PNA 2018 a 2024 e Simulações APNA 2023 — Classificação clínica AMBOSS"),
        "versao": base_metadata.get("versao", "A"),
        "ano_da_prova": base_metadata.get("ano_da_prova", "2018–2024"),
        "total_questoes": len(all_questions),
        "classificacao_referencia": base_metadata.get("classificacao_referencia", "AMBOSS — PNA Matrix 2026"),
        "questoes": all_questions
    }

    target_paths = [
        "src/data/banco_questoes_pna.json",
        "public/data/banco_questoes_pna.json"
    ]

    for target_path in target_paths:
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved merged database to {target_path} ({len(all_questions)} total questions)")

if __name__ == "__main__":
    folder = sys.argv[1] if len(sys.argv) > 1 else r"E:\Nova pasta (2)"
    merge_specific_parts(folder)

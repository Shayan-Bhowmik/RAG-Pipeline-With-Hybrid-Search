

import json
from app.db.supabase_client import get_supabase_client

def main():
    sb = get_supabase_client()
    
    # Fetch all chunks
    result = sb.table("chunks").select("id, doc_id, page_or_section, text").execute()
    
    if not result.data:
        print("No chunks found in database.")
        return

    # Save to JSON
    out_file = "chunks_dump.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(result.data, f, indent=2)
        
    print(f"Dumped {len(result.data)} chunks to {out_file}")

if __name__ == "__main__":
    main()

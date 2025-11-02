#!/usr/bin/env python3
"""
Convert ZIM article metadata JSON to SQLite database.
Creates a table with article metadata and internal links.
"""

import json
import sqlite3
import argparse
from pathlib import Path
import sys


def create_tables(conn):
    """Create the database tables for articles and links."""
    cursor = conn.cursor()
    
    # Create articles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            archive_name TEXT NOT NULL,
            name TEXT NOT NULL,
            title TEXT NOT NULL,
            path TEXT NOT NULL,
            mimetype TEXT,
            size INTEGER,
            link_count INTEGER DEFAULT 0,
            UNIQUE(archive_name, path)
        )
    ''')
    
    # Create links table (normalized for many-to-many relationship)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS article_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id INTEGER NOT NULL,
            target_path TEXT NOT NULL,
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
        )
    ''')
    
    # Create indexes for better query performance
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_articles_archive 
        ON articles(archive_name)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_articles_path 
        ON articles(path)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_links_article 
        ON article_links(article_id)
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_links_target 
        ON article_links(target_path)
    ''')
    
    conn.commit()
    print("Database tables created successfully.")


def get_archive_name_from_json(json_data):
    """Extract archive name from JSON metadata."""
    # Try to get from archive metadata
    if isinstance(json_data, dict) and 'archive_metadata' in json_data:
        metadata = json_data['archive_metadata']
        
        # Try different fields
        if 'name' in metadata:
            return metadata['name']
        elif 'filename' in metadata:
            # Extract filename without path
            return Path(metadata['filename']).stem
        elif 'title' in metadata:
            return metadata['title']
    
    return None


def insert_articles(conn, json_data, archive_name=None, batch_size=1000):
    """
    Insert articles from JSON data into the database.
    
    Args:
        conn: SQLite connection
        json_data: Parsed JSON data
        archive_name: Optional archive name to override auto-detection
        batch_size: Number of records to insert per batch
    """
    cursor = conn.cursor()
    
    # Determine archive name
    if not archive_name:
        archive_name = get_archive_name_from_json(json_data)
        if not archive_name:
            print("Warning: Could not determine archive name from JSON, using 'unknown'")
            archive_name = 'unknown'
    
    print(f"Archive name: {archive_name}")
    
    # Extract articles list
    if isinstance(json_data, dict) and 'articles' in json_data:
        articles = json_data['articles']
    elif isinstance(json_data, list):
        articles = json_data
    else:
        raise ValueError("JSON data must contain 'articles' key or be a list of articles")
    
    print(f"Processing {len(articles)} articles...")
    
    articles_inserted = 0
    links_inserted = 0
    errors = 0
    
    # Process in batches
    for i in range(0, len(articles), batch_size):
        batch = articles[i:i + batch_size]
        
        for article in batch:
            try:
                # Extract article data
                name = article.get('name', '')
                title = article.get('title', '')
                path = article.get('path', '')
                mimetype = article.get('mimetype', 'text/html')
                size = article.get('size', 0)
                internal_links = article.get('internal_links', [])
                link_count = article.get('link_count', len(internal_links))
                
                # Insert article
                cursor.execute('''
                    INSERT OR REPLACE INTO articles 
                    (archive_name, name, title, path, mimetype, size, link_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (archive_name, name, title, path, mimetype, size, link_count))
                
                article_id = cursor.lastrowid
                articles_inserted += 1
                
                # Insert links if present
                if internal_links:
                    # Delete existing links for this article (in case of replacement)
                    cursor.execute('DELETE FROM article_links WHERE article_id = ?', (article_id,))
                    
                    # Insert new links
                    link_data = [(article_id, link) for link in internal_links]
                    cursor.executemany('''
                        INSERT INTO article_links (article_id, target_path)
                        VALUES (?, ?)
                    ''', link_data)
                    links_inserted += len(internal_links)
                
            except Exception as e:
                print(f"Error inserting article '{article.get('title', 'unknown')}': {e}", file=sys.stderr)
                errors += 1
                continue
        
        # Commit batch
        conn.commit()
        
        if (i + batch_size) % 5000 == 0 or (i + batch_size) >= len(articles):
            print(f"Processed {min(i + batch_size, len(articles))}/{len(articles)} articles...")
    
    print(f"\nInserted {articles_inserted} articles and {links_inserted} links.")
    if errors > 0:
        print(f"Encountered {errors} errors during insertion.")
    
    return articles_inserted, links_inserted


def print_stats(conn):
    """Print database statistics."""
    cursor = conn.cursor()
    
    # Count articles by archive
    cursor.execute('''
        SELECT archive_name, COUNT(*) as count
        FROM articles
        GROUP BY archive_name
    ''')
    
    print("\n=== Database Statistics ===")
    for row in cursor.fetchall():
        print(f"Archive '{row[0]}': {row[1]} articles")
    
    # Total links
    cursor.execute('SELECT COUNT(*) FROM article_links')
    total_links = cursor.fetchone()[0]
    print(f"Total internal links: {total_links}")
    
    # Average links per article
    cursor.execute('SELECT AVG(link_count) FROM articles')
    avg_links = cursor.fetchone()[0]
    if avg_links:
        print(f"Average links per article: {avg_links:.1f}")


def main():
    parser = argparse.ArgumentParser(
        description='Convert ZIM article JSON metadata to SQLite database'
    )
    parser.add_argument('json_file', help='Input JSON file with article metadata')
    parser.add_argument('--database', '-d', default='zim_articles.db',
                        help='Output SQLite database file (default: zim_articles.db)')
    parser.add_argument('--archive-name', '-a', default=None,
                        help='Override archive name (auto-detected from JSON if not provided)')
    parser.add_argument('--batch-size', '-b', type=int, default=1000,
                        help='Number of records to insert per batch (default: 1000)')
    parser.add_argument('--append', action='store_true',
                        help='Append to existing database instead of creating new one')
    
    args = parser.parse_args()
    
    # Load JSON data
    print(f"Loading JSON file: {args.json_file}")
    try:
        with open(args.json_file, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON file: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Check if database exists
    db_exists = Path(args.database).exists()
    
    if db_exists and not args.append:
        response = input(f"Database '{args.database}' already exists. Overwrite? (y/N): ")
        if response.lower() != 'y':
            print("Operation cancelled.")
            sys.exit(0)
        Path(args.database).unlink()
    
    # Connect to database
    print(f"Connecting to database: {args.database}")
    conn = sqlite3.connect(args.database)
    
    try:
        # Create tables
        create_tables(conn)
        
        # Insert articles
        print("\n=== Importing Articles ===")
        insert_articles(conn, json_data, args.archive_name, args.batch_size)
        
        # Print statistics
        print_stats(conn)
        
        print(f"\nDatabase saved to: {args.database}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == '__main__':
    main()

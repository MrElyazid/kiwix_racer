#!/usr/bin/env python3

"""
Extracts metadata and internal links from a ZIM archive.
metadata is : article name, title, path, and internal wikipedia links in the article.
"""

import json
from pathlib import Path
from libzim.reader import Archive
from bs4 import BeautifulSoup
from typing import Dict, List
import sys
from urllib.parse import unquote


def get_archive_metdata(archive: Archive) -> Dict:
    """Extracts general metadata about the ZIM archive."""

    metadata = {}

    try:
        metadata['filename'] = str(archive.filename)
    except:
        pass

    try:
        metadata['filesize'] = archive.filesize
    except:
        pass

    try:
        metadata['archive_count'] = archive.article_count
    except:
        pass

    try:
        metadata['uuid'] = str(archive.uuid)
    except:
        pass

    try:
        metadata['has_main_entry'] = archive.has_main_entry
    except:
        pass

    metadata_fields = [
        'Title', 'Creator', 'Publisher', 'Date', 'Description', 'Language', 'Name', 'Tags', 'Flavour', 'Source', 'Scraper'
    ]

    for field in metadata_fields:
        try:
            if archive.has_metadata(field):
                metadata[field.lower()] = archive.get_metadata(field)

        except:
            pass

    return metadata

def extract_internal_links(html_content: str) -> List[str]:
    """
    Extracts internal wikipedia links from html content with bs4.

    Args:
        html_content: html content of the article

    Returns:
        list of internal links paths ( unique, converted from a set )
    """

    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        links = set()

        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']

            # if the link is external or an anchor or js void, skip it

            if href.startswith(('http://', 'https://', '//', '#', 'javascript')):
                continue

             # also skip special wiki pages

            if any(x in href for x in ['Special:', 'Wikipedia:', 'Help:', 'File:', 'Category:']):
                continue

            # remove the './' prefix

            if href.startswith('./'):
                href = href[2:]
            if href.startswith('.//'):
                 href = href[3:]

            # remove the anchor fragment if link contains it

            if '#' in href:
                href = href.split('#')[0]

            if not href:
                continue

            href = unquote(href)

            # add to set

            links.add(href)

        return sorted(list(links))

    except Exception as e:
        print(f"WARN: error parsing html for links: {e}", file=sys.stderr)
        return []


def extract_article_data(archive: Archive, max_articles: int = None, min_size: int = 500, extract_links: bool = True) -> List[Dict]:
    """
    Extracts article metadata including name, title, path, mimetypeand internal links.
    only does this for actual articles (non-redirects, html content above a minimal size).

    Args:
        archive: ZIM archive object
        max_articles: Maximum number of articles to process (None or all)
        min_size: Minimum article size in bytes to filter out stubs and redirects (500 bytes is min)

extract_links: whether to extract internal links for the article (default: True)

    Returns:
        List of dictionaries containing article metadata and links

    """

    articles = []
    processed = 0

    skipped_redirect = 0
    skipped_non_html = 0
    skipped_small = 0

    print(f"Total entries in archive: {archive.entry_count}")
    print(f"Total articles (including redirects): {archive.article_count}")
    print(f"Minimum article size filter: {min_size} bytes")
    print(f"EXtract internal links: {extract_links}")
    print("Processing articles...")


    for entry_idx in range(archive.entry_count):
        try:
            entry = archive._get_entry_by_id(entry_idx)

            if entry.is_redirect:
                    skipped_redirect += 1
                    continue


            path = entry.path
            title = entry.title

            try:
                item = entry.get_item()
                mimetype = item.mimetype
                size = item.size


                if mimetype != 'text/html':
                    skipped_non_html += 1
                    continue

                if size <= min_size:
                    skipped_small += 1
                    continue

                article_data = {
                    'name': path,
                    'title': title,
                    'path': path,
                    'mimetype': mimetype,
                    'size': size
                }

                # internal links part

                if extract_links:
                    try:
                        html_content = bytes(item.content).decode('utf-8')
                        internal_links = extract_internal_links(html_content)
                        article_data['internal_links'] = internal_links
                        article_data['link_count'] = len(internal_links)
                    except Exception as e:
                        print(f"WARN: could not extract links from {path}: {e}", file=sys.stderr)
                        article_data['internal_links'] = []
                        article_data['link_count'] = 0

                articles.append(article_data)
                processed += 1

                if processed % 1000 == 0:
                    print(f"Processed {processed} articles ...")

                if max_articles and processed >= max_articles:
                    print(f"Reached max_articles limit : {max_articles}")
                    break

            except Exception as e:
                    continue
        except Exception as e:
            print(f"WARN: error processing entry {entry_idx}: {e}", file=sys.stderr)
            continue

    print(f"\nCompleted! Extracted {processed} articles.")
    print(f"Skipped: {skipped_redirect} redirects, {skipped_non_html} non-html, {skipped_small} small.")

    return articles


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Extract metadata and internal links from a ZIM archive.')
    parser.add_argument('zim_file', help="Path to the zim file.")
    parser.add_argument('--output', '-o', default='zim_links.json',help='Output json file default is zim_links.json')
    parser.add_argument('--max-articles', '-m', type=int, default=None, help="max number of articles to process, default = all")
    parser.add_argument('--min-size', '-s', type=int, default=500, help='Minimum article size in bytes (default: 500)')
    parser.add_argument('--no-links', action='store_true', help='skip extracting internal links (metadata only)')
    parser.add_argument('--articles-only', action='store_true', help='Save only article data without archiving metadata')

    args = parser.parse_args()

    print(f"Opening ZIM archive: {args.zim_file}")
    archive = Archive(args.zim_file)

    print("\n=== Archive Metadata ===")
    metadata = get_archive_metdata(archive)
    for key, value in metadata.items():
        print(f"{key}: {value}")

    print("\n=== Extracting Articles ===")
    articles = extract_article_data(
        archive,
        max_articles=args.max_articles,
        min_size=args.min_size,
        extract_links=not args.no_links
    )

    if args.articles_only:
        output_data = articles
    else:
        output_data = {
            'archive_metadata': metadata,
            'articles': articles,
            'extraction_info': {
                'total_articles_extracted': len(articles),
                'min_size_filter': args.min_size,
                'links_extracted': not args.no_links
            }
        }

    print(f"\nSaving data to {args.output}...")
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)


    print(f"Done, Extracted metadata for {len(articles)} articles.")

    if not args.no_links and articles:
        total_links = sum(article.get('link_count', 0) for article in articles)
        avg_links = total_links / len(articles) if articles else 0
        print(f"Total internal links extracted: {total_links}")
        print(f"Average links per article: {avg_links:.1f}")

if __name__ == "__main__":
    main()


    

import os
import requests
import json
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Tavily Search")

@mcp.tool()
def tavily_search(query: str, max_results: int = 4) -> str:
    """Search the web for educational resources using Tavily."""
    tavily_key = os.environ.get("TAVILY_API_KEY")
    if not tavily_key:
        return json.dumps({"error": "TAVILY_API_KEY not found"})
        
    try:
        res = requests.post(
            'https://api.tavily.com/search',
            json={
                'api_key': tavily_key,
                'query': query,
                'max_results': max_results
            }
        )
        return json.dumps(res.json().get('results', []))
    except Exception as e:
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    mcp.run()

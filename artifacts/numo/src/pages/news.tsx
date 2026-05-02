import { useGetNewsFeed, useGetMarketNews } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function News() {
  const { data: myFeed, isLoading: loadingMyFeed } = useGetNewsFeed(
    { page: 1 }, 
    { query: { queryKey: ["/api/news/feed", 1] } }
  );
  
  const { data: marketNews, isLoading: loadingMarketNews } = useGetMarketNews(
    { query: { queryKey: ["/api/market/news"] } }
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">News Feed</h1>
      </div>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="my-feed">My Feed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="market" className="space-y-6">
          {loadingMarketNews ? (
             <NewsSkeletons />
          ) : marketNews?.map(article => (
            <NewsArticleCard key={article.id} article={article} />
          ))}
        </TabsContent>
        
        <TabsContent value="my-feed" className="space-y-6">
          {loadingMyFeed ? (
             <NewsSkeletons />
          ) : myFeed?.articles?.length ? (
            myFeed.articles.map(article => (
              <NewsArticleCard key={article.id} article={article} />
            ))
          ) : (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
              <h3 className="text-lg font-medium mb-1">Your feed is empty</h3>
              <p className="text-muted-foreground">Add assets to your watchlist to see personalized news here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NewsSkeletons() {
  return (
    <div className="space-y-6">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex gap-4 p-4 rounded-lg border border-border bg-card">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="w-32 h-24 rounded-md hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

function NewsArticleCard({ article }: { article: any }) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish": return <TrendingUp className="w-4 h-4 text-success" />;
      case "bearish": return <TrendingDown className="w-4 h-4 text-destructive" />;
      case "neutral": return <Minus className="w-4 h-4 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <a 
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col sm:flex-row gap-6 p-5 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors group"
    >
      <div className="flex-1 space-y-3">
        <h3 className="text-xl font-bold leading-snug group-hover:text-primary transition-colors">
          {article.headline}
        </h3>
        
        {article.summary && (
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {article.summary}
          </p>
        )}
        
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium pt-2">
          <span className="text-foreground">{article.source}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" /> 
            {new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
          
          {article.sentiment && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-foreground capitalize">
              {getSentimentIcon(article.sentiment)} {article.sentiment}
            </span>
          )}

          {article.tickers && article.tickers.length > 0 && (
            <div className="flex gap-1 ml-auto">
              {article.tickers.slice(0,3).map((t: string) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase text-[10px]">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {article.image && (
        <div className="sm:w-48 sm:h-32 shrink-0 rounded-lg overflow-hidden border border-border">
          <img src={article.image} alt={article.headline} className="w-full h-full object-cover" />
        </div>
      )}
    </a>
  );
}

import { useState, useEffect } from 'react';
import { BoxOfficeMovie, MovieDetail } from './types';
import { Moon, Sun, Calendar, Info, X, TrendingUp, Users, Film, Clock, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function formatDateForApi(dateStr: string) {
  return dateStr.replace(/-/g, '');
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // By default, the KOFIC API is most reliable for 'yesterday'
  const getInitialDates = () => {
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');
    return { todayStr, yesterdayStr };
  };

  const { todayStr, yesterdayStr } = getInitialDates();
  
  const [date, setDate] = useState(yesterdayStr);
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<BoxOfficeMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetail | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  useEffect(() => {
    let active = true;
    const fetchBoxOffice = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/boxoffice?targetDt=${formatDateForApi(date)}`);
        if (res.ok && active) {
          const data = await res.json();
          setMovies(data?.boxOfficeResult?.dailyBoxOfficeList || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBoxOffice();
    return () => { active = false; };
  }, [date]);

  const handleMovieClick = async (movieCd: string) => {
    setModalOpen(true);
    setLoadingModal(true);
    try {
      const res = await fetch(`/api/movie/${movieCd}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedMovie(data?.movieInfoResult?.movieInfo || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModal(false);
    }
  };

  const formatNumber = (numStr: string) => {
    return parseInt(numStr || '0').toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-indigo-500" />
            <h1 className="text-xl font-bold tracking-tight">KOFIC Box Office</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                max={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 font-sans">
          Daily Chart &nbsp;
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
            {date}
          </span>
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {movies.length > 0 ? (
              movies.map((movie, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={movie.movieCd}
                  onClick={() => handleMovieClick(movie.movieCd)}
                  className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-indigo-500/20 dark:text-indigo-400/20 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                        {movie.rank}
                      </span>
                      {Number(movie.rankInten) > 0 && <span className="text-xs font-semibold text-emerald-500 flex items-center">▲ {movie.rankInten}</span>}
                      {Number(movie.rankInten) < 0 && <span className="text-xs font-semibold text-rose-500 flex items-center">▼ {Math.abs(Number(movie.rankInten))}</span>}
                      {movie.rankOldAndNew === 'NEW' && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">NEW</span>}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold leading-tight mb-4 truncate" title={movie.movieNm}>
                    {movie.movieNm}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> Daily</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{formatNumber(movie.audiCnt)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Total</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{formatNumber(movie.audiAcc)}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-slate-500">
                No box office data available for this date.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Overlay */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setModalOpen(false); setSelectedMovie(null); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8"
            >
              <button 
                onClick={() => { setModalOpen(false); setSelectedMovie(null); }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              {loadingModal ? (
                <div className="flex justify-center items-center py-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : selectedMovie ? (
                <div>
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold mb-2 tracking-tight">{selectedMovie.movieNm}</h2>
                    {selectedMovie.movieNmEn && (
                      <p className="text-slate-500 dark:text-slate-400 font-medium">{selectedMovie.movieNmEn}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                    {selectedMovie.audits?.[0] && (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {selectedMovie.audits[0].watchGradeNm}
                      </span>
                    )}
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {selectedMovie.showTm} min
                    </span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {selectedMovie.openDt ? `${selectedMovie.openDt.substring(0,4)}.${selectedMovie.openDt.substring(4,6)}.${selectedMovie.openDt.substring(6,8)}` : 'N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                    <div className="space-y-4">
                      <div>
                        <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2">
                          <Info className="w-3 h-3" /> Categories
                        </h4>
                        <p className="font-medium">
                          {selectedMovie.genres?.map(g => g.genreNm).join(', ') || 'N/A'} 
                          <span className="mx-2 text-slate-300 dark:text-slate-700">|</span> 
                          {selectedMovie.typeNm}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2">
                          <Globe className="w-3 h-3" /> Nation
                        </h4>
                        <p className="font-medium">
                          {selectedMovie.nations?.map(n => n.nationNm).join(', ') || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2">
                          <Users className="w-3 h-3" /> Directors
                        </h4>
                        <p className="font-medium leading-relaxed">
                          {selectedMovie.directors?.map(d => d.peopleNm).join(', ') || 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2">
                          <Users className="w-3 h-3" /> Cast
                        </h4>
                        <p className="font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                          {selectedMovie.actors?.slice(0, 5).map(a => a.peopleNm).join(', ')}
                          {selectedMovie.actors?.length > 5 && ' ...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-500">Failed to load details.</div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

function Login() {
    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl opacity-60 animate-float" style={{ animationDelay: '0s' }}></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-400/20 rounded-full blur-3xl opacity-60 animate-float" style={{ animationDelay: '2s' }}></div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                <div className="glass rounded-3xl p-10 shadow-2xl backdrop-blur-xl border border-white/40">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-3">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-800">
                            로그인
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            서비스 이용을 위해 로그인해주세요.
                        </p>
                    </div>

                    <form className="mt-8 space-y-6">
                        <div className="rounded-md space-y-4">
                            <div>
                                <label htmlFor="email-address" className="sr-only">아이디</label>
                                <input
                                    id="id"
                                    name="id"
                                    type="text"
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:z-10 sm:text-sm bg-white/50 transition-all"
                                    placeholder="아이디를 입력하세요"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">비밀번호</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:z-10 sm:text-sm bg-white/50 transition-all"
                                    placeholder="비밀번호를 입력하세요"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                                    로그인 유지
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-primary-600 hover:text-primary-500 hover:underline">
                                    비밀번호 찾기
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-500/30 transform transition hover:-translate-y-0.5"
                            >
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <svg className="h-5 w-5 text-primary-200 group-hover:text-primary-100 transition ease-in-out duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                </span>
                                로그인하기
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-500">
                        계정이 없으신가요?{' '}
                        <Link to="/register" className="font-bold text-secondary-600 hover:text-secondary-500 hover:underline">
                            회원가입 하기
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;

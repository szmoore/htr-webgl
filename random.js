/** Terrible hack; replace Math.random with the v8 random number generation **/
// http://v8.googlecode.com/svn-history/r8490/branches/bleeding_edge/src/v8.cc

g_seed = [0,0,0,0]; // seed

seed_rand = function() // change the seed
{
	for (var i = 0; i < 4; ++i)
	{
		g_seed[i] = [0xBAAD, 0xF00D, 0xABBA, 0xACDC][i];
		while (g_seed[i] == 0)
			g_seed[i] = random();
	}
	return g_seed;
}

rand = function ()
{
	if (g_seed[0] == 0) g_seed = seed_rand(g_seed);
	g_seed[0] = 18273 * (g_seed[0] & 0xFFFF) + (g_seed[0] >> 16);
	g_seed[1] = 36969 * (g_seed[1] & 0xFFFF) + (g_seed[1] >> 16);
	g_seed[2] = 23208 * (g_seed[2] & 0xFFFF) + (g_seed[2] >> 16);
	g_seed[3] = 27753 * (g_seed[3] & 0xFFFF) + (g_seed[3] >> 16);
	return ((g_seed[2] ^ g_seed[3]) << 16) + ((g_seed[0] ^ g_seed[1]) & 0xFFFF);
}

Math.random = function() {return 0.5+(rand()%1e8)/2e8;}

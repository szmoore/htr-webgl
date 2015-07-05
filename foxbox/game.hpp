#ifndef _GAME_H
#define _GAME_H

#include <foxbox/foxbox.h>
#include <vector>

class Game
{
	public:
		Game(int port, unsigned players=2);
		virtual ~Game();
		
		void Play();
		
		std::vector<Foxbox::Socket*> m_players;
		Foxbox::Socket * m_controller;
};

#endif //_GAME_H

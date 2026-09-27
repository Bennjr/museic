import { NavLink } from "react-router-dom";

const temp_playlists = [
    { "name": "temp1", "url": "/playlist", "description": "desc1" },
    { "name": "temp2", "url": "/playlist", "description": "desc2" },
    { "name": "temp3", "url": "/playlist", "description": "desc3" },
    { "name": "temp4", "url": "/playlist", "description": "desc4" },
    { "name": "temp5", "url": "/playlist", "description": "desc5" }
]

export default function Sidebar() {
    return (
        <div className="bg-c-secondary backdrop-blur-md text-c-text w-36 h-full flex flex-col justify-between sticky top-0 z-50 shadow-2xl" >
            <nav>
                <NavLink to="/">
                    <p>Hjem</p>
                </NavLink>
                <ul className="flex flex-col gap-6 w-full">
                    {temp_playlists.map((list) => (
                        <li key={list.name}>
                            <NavLink to={list.url} className="flex flex-col gap-2">
                                <p>{list.name}</p>
                                <p>{list.description}</p>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    )
}
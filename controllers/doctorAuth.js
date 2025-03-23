// Doctor Search Route
router.get('/doctors/search', (req, res) => {
    const { specialty } = req.query;
    const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');
    
    if (!specialty) {
        return wantsJson 
            ? res.status(400).json({
                success: false,
                error: 'Specialty parameter is required'
              })
            : res.render('error', { 
                message: 'Specialty parameter is required' 
              });
    }

    const query = `
        SELECT Name, Specialty, Phone
        FROM DOCTOR 
        WHERE Specialty LIKE ?`;

    conPool.query(query, [`%${specialty}%`], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return wantsJson
                ? res.status(500).json({
                    success: false,
                    error: 'Database error'
                  })
                : res.render('error', { 
                    message: 'Database error' 
                  });
        }

        const defaultUser = {
            Username: 'Guest',
            Role: 'viewer'
        };

        const user = req.session.user || defaultUser;

        return wantsJson
            ? res.json({
                success: true,
                data: results
              })
            : res.render('doctor', { 
                doctors: results,
                user: user,
                stats: {
                    totalPatients: 42,
                    upcomingAppointments: 8,
                    prescriptions: 15
                },
                recentAppointments: [
                    {
                        patient: "John Doe",
                        date: "2024-03-20",
                        status: "Completed"
                    },
                    {
                        patient: "Jane Smith",
                        date: "2024-03-21",
                        status: "Pending"
                    }
                ]
              });
    });
});
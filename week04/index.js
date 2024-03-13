const express = require('express');
const bodyParser = require('body-parser');
const PORT = 3000;
const app = express();

//registering the middleware
app.use(express.json({ extended: false }));
app.use(express.static('./views'));

//cofig view
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: true }));
//data 
const courses = [
    {
        id: 1,
        name_course: 'Node.js',
        course_type: 'Backend',
        semester: '3rd',
        department: 'CSE'
    },
    {
        id: 2,
        name_course: 'React.js',
        course_type: 'Frontend',
        semester: '4th',
        department: 'CSE'
    }
]
//routes
app.get('/', (req, res) => {
    res.render('index', {data: courses});
})

app.post('/save', (req, res) => {
    const {name_course, course_type, semester, department} = req.body;
    const course = {
        id: courses.length + 1,
        name_course,
        course_type,
        semester,
        department
    }
    courses.push(course);
    res.redirect('/');
})

app.post('/delete', (req, res) => {
    const selectedIds = Array.isArray(req.body.selectedCourses) ? req.body.selectedCourses : [req.body.selectedCourses];
    selectedIds.forEach(id => {
        const index = courses.findIndex(course => course.id == id);
        courses.splice(index, 1);
    });
    res.redirect('/');
});  

app.post('/update', (req, res) => {
    const { id, name_course, course_type, semester, department } = req.body;
    const index = courses.findIndex(course => course.id == id);
    if (index !== -1) {
        // Môn học được tìm thấy, cập nhật thông tin
        courses[index].name_course = name_course;
        courses[index].course_type = course_type;
        courses[index].semester = semester;
        courses[index].department = department;
        res.redirect('/');
    } else {
        // Không tìm thấy môn học
        res.status(404).send('Môn học không tồn tại');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

